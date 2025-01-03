const assert = require("assert"),
	fs = require("fs"),
	os = require("os"),
	path = require("path")

const { gl, glfw, glutils, Window, Shaderman } = require("../anode_gl/index.js")
const App = require("./app.js")
const AppPreviz = require("./app-previz.js")

process.on('uncaughtException', function (err) {
    console.log(err);
});

let overlap = 4
let decorated = true
let fullscreen = true
let sync = false

// sync on the global Window, not on each window:
Window.syncfps = 45

let win_div = 4

let common = {
    overlap,
    dev: false,
    timeoffset: 0,

    lidar_dim: [240*3, 320],

    machines: {
        "F": {
            name: "F",
            content_res: [3840, 1872],
            res: [1920, 3240],
            show: 1
        },
        "R": {
            name: "R",
            content_res: [3840, 2582],
            res: [3840, 2160],
            show: 2
        },
        "L": {
            name: "L",
            content_res: [3840, 2582],
            res: [3840, 2160],
            show: 3
        },
        "E": {
            name: "E",
            content_res: [1752, 1872],
            res: [1920, 1080],
            show: 4
        }
    },

    allapps: []
}

const ipconfig = {
    "192.168.100.51": "F",
    "192.168.100.52": "R",
    "192.168.100.53": "L",
    "192.168.100.54": "E"
}

let title = "F"

// print process.argv
process.argv.forEach(function (val, index) {
    switch(val) {
        case "F":
        case "E":
        case "L":
        case "R":
            title = val;
            break;
        default: {

        }
    }
});

const ips = []
const networks = os.networkInterfaces()
for (const name of Object.keys(networks)) {
    for (const net of networks[name]) {
        const familyV4Value = typeof net.family === 'string' ? 'IPv4' : 4
        if (net.family === familyV4Value && !net.internal) {
            let ip = net.address
            console.log("IP", ip)
            if (ipconfig[ip]) title = ipconfig[ip]
        }
    }
}

console.log("Thousandfold Drift: ", title)

switch (title) {
    case "E": {
        new App({
            title: "E",
            machine: common.machines.E,
            width: common.machines.E.content_res[0] / win_div, 
            height: common.machines.E.content_res[1] / win_div,
            pos: [3840 / win_div, 2582 / win_div],
            decorated,
            fullscreen,
            sync,
            final_rotate: 1,
        
            config: common.machines.E,
            senders: [
                { name: "EF", dim: [16, 1872], pos: [0, 0] },
            ],
            receivers: [
                { name: "FE", dim: [16, 1872], pos: [overlap-16, 0], angle: 0 },
            ],
        }, common)
        break;
    }
    case "L": {
        new App({
            title: "L",
            machine: common.machines.L,
            width: common.machines.L.content_res[0] / win_div, 
            height: common.machines.L.content_res[1] / win_div,
            pos: [0, 0],
            decorated,
            fullscreen,
            sync,
        
            config: common.machines.L,
            senders: [
                { name: "LF", dim: [3840, 16], pos: [0, 0] },
            ],
            receivers: [
                { name: "FL", dim: [3840, 16], pos: [0, overlap-16], angle: 0 },
            ],
        }, common)
        break;
    }
    case "R": {
        new App({
            title: "R",
            machine: common.machines.R,
            width: common.machines.R.content_res[0] / win_div, 
            height: common.machines.R.content_res[1] / win_div,
            pos: [0, (2582 + 1872) / win_div],
            decorated,
            fullscreen,
            sync,
            final_rotate: 2,
        
            config: common.machines.R,
            senders: [
                { name: "RF", dim: [3840, 16], pos: [0, 2582-16] },
            ],
            receivers: [
                { name: "FR", dim: [3840, 16], pos: [0, 2582-overlap], angle: 0 },
            ],
        }, common)
        break;
    }
    
    default: {
        new App({
            title: "F",
            machine: common.machines.F,
            width: common.machines.F.content_res[1] / win_div, 
            height: common.machines.F.content_res[0] / win_div,
            pos: [0, 2582 / win_div],
            decorated,
            fullscreen,
            sync,
            final_rotate: 3,
        
            config: common.machines.F,
            senders: [
                { name: "FL", dim: [3840, 16], pos: [0, 1872 - 16] },
                { name: "FR", dim: [3840, 16], pos: [0, 0] },
                { name: "FE", dim: [16, 1872], pos: [3840-16, 0] },
            ],
            receivers: [
                { name: "LF", dim: [3840, 16], pos: [0, 1872 - overlap], angle: 0 },
                { name: "RF", dim: [3840, 16], pos: [0, overlap-16], angle: 0 },
                { name: "EF", dim: [16, 1872], pos: [3840-overlap, 0], angle: 0 },
            ],
        }, common)
        break;
    }
}


Window.animate()