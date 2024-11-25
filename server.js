const assert = require("assert"),
    fs = require("fs"),
    os = require("os"),
    path = require("path")
const net = require('net')
const udp = require('dgram');

const PORT = 8888
const MAX_PORT = 7400

// this code only happens once. 
let ip2name = {
    "192.168.100.51": "F",
    "192.168.100.52": "L",
    "192.168.100.53": "R",
    "192.168.100.54": "E"
}
let name2ip = {
    F: "192.168.100.51",
    L: "192.168.100.52",
    R: "192.168.100.53",
    E: "192.168.100.54"
}


const myIP = "127.0.0.1"
const localhost = true
let mynames = ["F", "L", "R", "E"]

const networks = os.networkInterfaces()
for (const [name, net] of Object.entries(networks)) {
    const familyV4Value = typeof net.family === 'string' ? 'IPv4' : 4
    if (net.family === familyV4Value && !net.internal) {
        let ip = net.address
        if (ip2name[ip]) {
            myIP = ip
            localhost = false
            mynames = [ip2name[ip]]
            console.log("I am machine", mynames)
        }
    }
}
console.log("myIP", myIP, localhost)

if (localhost) {
    name2ip = {
        F: myIP,
        L: myIP,
        R: myIP,
        E: myIP
    }
}

let maxclient = udp.createSocket('udp4');

function padString(s) {
    // 4-byte padding:
    let plen = Math.ceil((s.length+1)/4)*4
    s = s.padEnd(plen, '\0')
    return Buffer.from(s)
}

function sendMax(msg) {
    if (maxclient) {
        for (let [key, value] of Object.entries(msg)) {
            switch (typeof value) {
                case "number": {
                    let res = []
                    res.push(...padString("/"+key))
                    res.push(44, 102, 0,  0) //...padString(",f"))
                    // reverse for endianness
                    res.push(...([...Buffer.from(new Float32Array([value]).buffer)].reverse()))
                    maxclient.send(Buffer.from(res), MAX_PORT,'localhost');
                    break;
                }
                case "string": {
                    let res = []
                    res.push(...padString("/"+key))
                    res.push(44, 115, 0,  0) //...padString(",s"))
                    res.push(...padString(value))
                    maxclient.send(Buffer.from(res), MAX_PORT,'localhost');
                    break;
                }
            }
        }

    }
}

//let maxserver

// function startMaxServer() {
//     maxserver = udp.createSocket('udp4');


//     // emits when any error occurs
//     maxserver.on('error',function(error){
//         console.error('Error: ' + error);
//         maxserver.close();
//         maxserver = null
//         process.exit(-1)
//     });

//     // emits on new datagram msg
//     maxserver.on('message',function(msg,info){
//         console.log('Data received from client : ' + msg.toString());

//     });

//     //emits when socket is ready and listening for datagram msgs
//     maxserver.on('listening',function(){
//         const address = maxserver.address();
//         console.log('maxserver is listening at port' + address.port);
//         console.log('maxserver ip :' + address.address);
//         console.log('maxserver is IP4/IP6 : ' + address.family);
//     });

//     //emits after the socket is closed using socket.close();
//     maxserver.on('close',function(){
//         console.log('maxserver is closed !');
//         maxserver = null

//         setTimeout(function() {
//             startMaxServer()
//         }, 2000)
//     });

//     maxserver.bind(MAX_PORT);
// }

// function sendMax(msg) {
//     if (!maxserver) return
//     //sending msg
//     maxserver.send(msg, MAX_PORT, 'localhost', function(error){
//         if(error){
//             console.error(error);
//         }
//     });
// }

// startMaxServer()

//////////////////////////////////////  ;;;;;;;;;;;;;;;;;;;;;;;

const server = net.createServer()
server.on('error', (error) => {
    log("tcp_server", "error", error)
    server.close()

    process.exit(-1)
})

let registered = {}
let sockets = []

server.on('connection', sock => {
    sockets.push(sock)

    sock.on('data', msg => {
        // this would be registering the socket for certain names?
        let name = msg.toString()
        if (!registered[name]) registered[name] = []
        registered[name].push(sock)
    })

	sock.on('close', data => {
        for (let list of Object.values(registered)) {
            let index = list.findIndex(o => o.remoteAddress === sock.remoteAddress && o.remotePort === sock.remotePort)
            if (index !== -1) list.splice(index, 1) 
        }
		console.log("tcp_server", "info", `Socket closed with ${sock.remoteAddress}:${sock.remotePort}`)
	})	
})

server.listen(PORT, myIP, () => {
    const address = server.address()
    console.log("tcp_server", "info", 'Server is listening at port ' + address.port)
    console.log("tcp_server", "info", 'Server ip :' + address.address)
    console.log("tcp_server", "info", 'Server is IP4/IP6 : ' + address.family)
})

function sendData(name, data) {
    // need list of sockets interested in this name
    if (!registered[name]) return;
    
    for (let sock of registered[name]) {
        sock.write(data)
    }
}

// now to register interest:
let received = {
}

function requestService(name, bytes) {
    const client = new net.Socket()
    const host = name2ip[name[0]]

    const state = {
        name, 
        dst: new Uint8Array(bytes.buffer),
        idx: 0,
        frame: 0
    }

    received[name] = state

    client.connect(PORT, host, function() {
        console.log('Connected', name)
        // send message to server to register this socket as interested in this name:
        client.write(name)
    })

    client.on('data', buf => {



        // dst is a UInt8array wrapper 
        // idx is the byte index into this array that is currently written
        let { dst, idx } = state
        let msgbyteidx = 0
        let bytes_remain = buf.byteLength

        // the bytes received could be a partial buffer
        // it could even be multiple buffers
        // there's no guarantees of anything here
        // except that the bytes arrive in order
        while(bytes_remain) {
            // copy as much as we can:
            let part_bytes = Math.min(bytes_remain, dst.byteLength - idx)
            // get that slice from the received data:
            let src = new Uint8Array(buf.buffer, msgbyteidx, part_bytes)
            // copy into our local buffer
            dst.set(src, idx)
            // move on
            bytes_remain -= part_bytes
            msgbyteidx += part_bytes
            idx += part_bytes
            if (idx >= dst.byteLength) {
                idx = 0;
                state.frame++
            }
        }
        // update stream marker:
        state.idx = idx
    })

    client.on('close', () => {
        console.log('Connection closed')

        // schedule a reconnection attempt:
        setTimeout(function() {
            requestService(name, bytes)
        }, 1000)
    })
}

function requestJSON(name) {

    const client = new net.Socket()
    const host = name2ip[name[0]]

    const state = {
        name, 
        dst: null,
        idx: 0,
        frame: 0
    }

    received[name] = state

    client.connect(PORT, host, function() {
        console.log('Connected', name)
        // send message to server to register this socket as interested in this name:
        client.write(name)
    })

    client.on('data', buf => {

        console.log(buf.toString())

        let msg = buf.toString().split("\0").pop()
        if (msg) {
            state.dst = JSON.parse(msg)
            state.frame++

            console.log(state)
        }
    })

    client.on('close', () => {
        console.log('Connection closed')

        // schedule a reconnection attempt:
        setTimeout(function() {
            requestService(name, bytes)
        }, 1000)
    })
}

function getData(name) {
    return received[name]
}

module.exports = {
    name2ip, 
    myIP, localhost,

    sendData, sendMax,
    requestService, requestJSON,
    getData,
}