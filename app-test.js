const { gl, glfw, glutils, Window, Shaderman } = require("../anode_gl/index.js")
const App = require("./app.js")

// sync on the global Window, not on each window:
Window.syncfps = 60

let overlap = 2
let res = 400

let a1 = new App({
    title: "a1",
    width: 1600, height: 1600,
    pos: [50, 50],

    senders: [
       { name: "a1", dim: [overlap, res], pos: [res - overlap, 0] }
    ],
    
    receivers: [
        { name: "a2", dim: [overlap, res], pos: [res - overlap, 0] }
    ]
})

let a2 = new App({
    title: "a2",
    width: 1600, height: 1600,
    pos: [50 + 1600, 50],

    senders: [
        { name: "a2", dim: [overlap, res], pos: [0, 0] }
    ],
    receivers: [
        { name: "a1", dim: [overlap, res], pos: [0, 0] }
    ],
})

Window.animate()