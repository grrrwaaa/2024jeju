let udp = require('dgram');

let server = udp.createSocket('udp4');

// emits when any error occurs
server.on('error', function (error) {
    console.log('Error: ' + error);
    //server.close();
});

// emits on new datagram msg
server.on('message', function (msg, info) {
    //console.log('Data received from client : ' + new Uint8Array(msg));
    console.log('Received %d bytes from %s:%d\n', msg.length, info.address, info.port);

    //sending msg
    server.send(msg, info.port, 'localhost', function (error) {
        if (error) {
            client.close();
        } else {
            console.log('Data sent !!!');
        }

    });

});

server.bind(2222);

//emits when socket is ready and listening for datagram msgs
server.on('listening',function(){
    var address = server.address();
    var port = address.port;
    var family = address.family;
    var ipaddr = address.address;
    console.log('Server is listening at port' + port);
    console.log('Server ip :' + ipaddr);
    console.log('Server is IP4/IP6 : ' + family);
});


// creating a client socket
var client = udp.createSocket('udp4');

client.on('message',function(msg, info){
  //console.log('Data received from server : ' + new Uint8Array(msg));
  console.log('Received %d bytes from %s:%d\n',msg.length, info.address, info.port);
});

// can send an array of messages, it will pack into bytes
// so this is like a header + data
client.send(["LR", new Uint8Array(3840*16)],2222,'localhost',function(error){
  if(error){
    client.close();
  }else{
    console.log('Data sent !!!', ["LR", new Uint8Array(3840*16)]);
  }
});