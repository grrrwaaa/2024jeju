const { gl, glfw, glutils, Window, Shaderman } = require("../anode_gl/index.js")
const App = require("./app.js")

// sync on the global Window, not on each window:
Window.syncfps = 60

let a1 = new App({
    title: "a1",
    width: 1600, height: 1600,
    pos: [50, 50],

    recv: "a1", edge: 0.75, 

    senders: [
        { name: "a1", dim: [4, 200], pos: [200 - 4, 0] }
    ],
    
    receivers: [
        { name: "a2", dim: [4, 200], pos: [200 - 4, 0] }
    ]
})

let a2 = new App({
    title: "a2",
    width: 1600, height: 1600,
    pos: [50 + 1600, 50],

    recv: "a2", edge: 0.25,

    senders: [
        { name: "a2", dim: [4, 200], pos: [0, 0] }
    ],
    receivers: [
        { name: "a1", dim: [4, 200], pos: [0, 0] }
    ],
})

Window.animate()