const { gl, glfw, glutils, Window, Shaderman } = require("../anode_gl/index.js")
const App = require("./app.js")

// sync on the global Window, not on each window:
Window.syncfps = 60

let overlap = 2
let decorated = false

let win_div = 4

let common = {
    overlap,

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
    }
}

let F = new App({
    title: "F",
    width: common.machines.F.content_res[0] / win_div, 
    height: common.machines.F.content_res[1] / win_div,
    pos: [0, 2582 / win_div],
    decorated,

    config: common.machines.F,
    senders: [
        { name: "FL", dim: [3840, 16], pos: [0, 1872 - 16] },
    ],
    receivers: [
        { name: "LF", dim: [3840, 16], pos: [0, 1872 - 16] },
    ],
}, common)

let E = new App({
    title: "E",
    width: common.machines.E.content_res[0] / win_div, 
    height: common.machines.E.content_res[1] / win_div,
    pos: [3840 / win_div, 2582 / win_div],
    decorated,

    config: common.machines.E,
    senders: [],
    receivers: [],
}, common)

let L = new App({
    title: "L",
    width: common.machines.L.content_res[0] / win_div, 
    height: common.machines.L.content_res[1] / win_div,
    pos: [0, 0],
    decorated,

    config: common.machines.L,
    senders: [
        { name: "LF", dim: [3840, 16], pos: [0, 0] },
    ],
    receivers: [
        { name: "FL", dim: [3840, 16], pos: [0, 0] },
        
    ],
}, common)

let R = new App({
    title: "R",
    width: common.machines.R.content_res[0] / win_div, 
    height: common.machines.R.content_res[1] / win_div,
    pos: [0, (2582 + 1872) / win_div],
    decorated,

    config: common.machines.R,
    senders: [],
    receivers: [],
}, common)

// let a2 = new App({
//     title: "a2",
//     width: 1600, height: 1600,
//     pos: [50 + 1600, 50],
//     decorated,
//     senders: [],
//     receivers: [],
// }, common)

Window.animate()