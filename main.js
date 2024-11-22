const assert = require("assert"),
	fs = require("fs"),
	os = require("os"),
	path = require("path")
const { gl, glfw, glutils, Window, Shaderman } = require("../anode_gl/index.js")
const { vec2, vec3, vec4, quat, mat2, mat2d, mat3, mat4} = require("gl-matrix")
const App = require("./app.js")
const AppPreviz = require("./app-previz.js")

// sync on the global Window, not on each window:
Window.syncfps = 60

let overlap = 16
let decorated = false

let win_div = 4

let common = {
    overlap,
    dev: true,

    lidar_dim: [240*3, 320],

    machines: {
        "F": {
            name: "F",
            content_res: [3840, 1872],
            res: [1920, 3240],
            show: 1
        },
        "E": {
            name: "E",
            content_res: [1752, 1872],
            res: [1920, 1080],
            show: 4
        },
        "L": {
            name: "L",
            content_res: [3840, 2582],
            res: [3840, 2160],
            show: 3
        },
        "R": {
            name: "R",
            content_res: [3840, 2582], // 1272+904+406 = 2582
            res: [3840, 2160],
            show: 2
        }
    }, 

    allapps: {},
}

{
    // floor geometry:
    let floor_geom, far_wall_geom, near_wall_geom, left_wall_geom, right_wall_geom
    let config = new Function(fs.readFileSync("config.js", "utf-8"))()

    {
        let geom = glutils.makeQuad3D({ min: 0 })
        let modelmatrix = mat4.create()
        mat4.scale(modelmatrix, modelmatrix, [config.meters.x, config.meters.y, config.meters.z])
        mat4.rotateX(modelmatrix, modelmatrix, -Math.PI/2)
        mat4.translate(modelmatrix, modelmatrix, [0, 0, 0])


        mat4.translate(modelmatrix, modelmatrix, [0.5, 0.5, 0])
        mat4.rotateZ(modelmatrix, modelmatrix, Math.PI)
        mat4.translate(modelmatrix, modelmatrix, [-0.5, -0.5, 0])

        glutils.geomTransform(geom, modelmatrix)
        let texmatrix = mat3.create()
        mat3.translate(texmatrix, texmatrix, [0.5, 0.5])
        mat3.rotate(texmatrix, texmatrix, Math.PI/2)
        mat3.translate(texmatrix, texmatrix, [-0.5, -0.5])
        glutils.geomTexTransform(geom, texmatrix)

        glutils.geomSetAllNormals(geom, [0, 1, 0])

        floor_geom = geom

    }
    {
        let geom = glutils.makeQuad3D({ min: 0 })
        let modelmatrix = mat4.create()
        mat4.scale(modelmatrix, modelmatrix, [config.meters.x, config.meters.y, config.meters.z])
        mat4.translate(modelmatrix, modelmatrix, [0, 0, -1])
        glutils.geomTransform(geom, modelmatrix)
        let texmatrix = mat3.create()
        mat3.translate(texmatrix, texmatrix, [0.5, 0.5])
        mat3.rotate(texmatrix, texmatrix, -Math.PI/2)
        mat3.translate(texmatrix, texmatrix, [-0.5, -0.5])
        glutils.geomTexTransform(geom, texmatrix)
        far_wall_geom = geom
    }

    {
        let geom = glutils.makeQuad3D({ min: 0 })
        let modelmatrix = mat4.create()
        mat4.scale(modelmatrix, modelmatrix, [config.meters.x, config.meters.y, config.meters.z])
        mat4.rotateY(modelmatrix, modelmatrix, Math.PI)
        mat4.translate(modelmatrix, modelmatrix, [-1, 0, 0])
        glutils.geomTransform(geom, modelmatrix)
        near_wall_geom = geom
    }
    {
        let geom = glutils.makeQuad3D({ min: 0 })
        let geom2 = glutils.makeQuad3D({ min: 0 })

        let modelmatrix = mat4.create()
        let texmatrix = mat3.create()
        let ytotal = 2160, ywall = 1080, ygable = 725, yroof = 355

        // wall:
        // mat3.identity(texmatrix)
        // mat3.scale(texmatrix, texmatrix, [1, ywall/ytotal])
        // glutils.geomTexTransform(geom, texmatrix)
        // mat4.identity(modelmatrix)
        // mat4.scale(modelmatrix, modelmatrix, [config.meters.x, config.meters.y0, config.meters.z])
        // mat4.rotateY(modelmatrix, modelmatrix, Math.PI/2)
        // glutils.geomTransform(geom, modelmatrix)

        mat3.identity(texmatrix)
        mat3.scale(texmatrix, texmatrix, [1, ywall/ytotal])
        glutils.geomTexTransform(geom, texmatrix)
        mat4.identity(modelmatrix)
        mat4.scale(modelmatrix, modelmatrix, [config.meters.x, config.meters.y0, config.meters.z])
        mat4.translate(modelmatrix, modelmatrix, [1, 0, -1])
        mat4.rotateY(modelmatrix, modelmatrix, -Math.PI/2)
        glutils.geomTransform(geom, modelmatrix)

        // gable:
        // mat3.identity(texmatrix)
        // mat3.translate(texmatrix, texmatrix, [0, ywall/ytotal])
        // mat3.scale(texmatrix, texmatrix, [1, ygable/ytotal])
        // glutils.geomTexTransform(geom2, texmatrix)
        // mat4.identity(modelmatrix)
        // mat4.translate(modelmatrix, modelmatrix, [0, config.meters.y0, 0])
        // mat4.rotateZ(modelmatrix, modelmatrix, -config.meters.a_gable)
        // mat4.scale(modelmatrix, modelmatrix, [config.meters.x, config.meters.y_gable, config.meters.z])
        // mat4.rotateY(modelmatrix, modelmatrix, Math.PI/2)
        // glutils.geomTransform(geom2, modelmatrix)

        mat3.identity(texmatrix)
        mat3.translate(texmatrix, texmatrix, [0, ywall/ytotal])
        mat3.scale(texmatrix, texmatrix, [1, ygable/ytotal])
        glutils.geomTexTransform(geom2, texmatrix)

        mat4.identity(modelmatrix)
        mat4.translate(modelmatrix, modelmatrix, [config.meters.x, config.meters.y0, 0])
        mat4.rotateZ(modelmatrix, modelmatrix, config.meters.a_gable)
        mat4.scale(modelmatrix, modelmatrix, [config.meters.x, config.meters.y_gable, config.meters.z])
        mat4.translate(modelmatrix, modelmatrix, [0, 0, -1])
        mat4.rotateY(modelmatrix, modelmatrix, -Math.PI/2)
        glutils.geomTransform(geom2, modelmatrix)

        glutils.geomAppend(geom, geom2)

        mat3.identity(texmatrix)
        mat3.translate(texmatrix, texmatrix, [0.5, 0.5])
        mat3.rotate(texmatrix, texmatrix, Math.PI)
        mat3.translate(texmatrix, texmatrix, [-0.5, -0.5])
        glutils.geomTexTransform(geom, texmatrix)

        right_wall_geom = geom
    }

    {
        let geom = glutils.makeQuad3D({ min: 0 })
        let geom2 = glutils.makeQuad3D({ min: 0 })
        let geom3 = glutils.makeQuad3D({ min: 0 })

        let modelmatrix = mat4.create()
        let texmatrix = mat3.create()
        let ytotal = 2160, ywall = 1080, ygable = 725, yroof = 355

        // // wall
        // mat3.identity(texmatrix)
        // mat3.scale(texmatrix, texmatrix, [1, ywall/ytotal])
        // glutils.geomTexTransform(geom, texmatrix)
        // mat4.scale(modelmatrix, modelmatrix, [config.meters.x, config.meters.y0, config.meters.z])
        // mat4.translate(modelmatrix, modelmatrix, [1, 0, -1])
        // mat4.rotateY(modelmatrix, modelmatrix, -Math.PI/2)
        // glutils.geomTransform(geom, modelmatrix)

        // wall:
        mat3.identity(texmatrix)
        mat3.scale(texmatrix, texmatrix, [1, ywall/ytotal])
        glutils.geomTexTransform(geom, texmatrix)
        mat4.identity(modelmatrix)
        mat4.scale(modelmatrix, modelmatrix, [config.meters.x, config.meters.y0, config.meters.z])
        mat4.rotateY(modelmatrix, modelmatrix, Math.PI/2)
        glutils.geomTransform(geom, modelmatrix)

        // gable:
        // mat3.identity(texmatrix)
        // mat3.translate(texmatrix, texmatrix, [0, ywall/ytotal])
        // mat3.scale(texmatrix, texmatrix, [1, ygable/ytotal])
        // glutils.geomTexTransform(geom2, texmatrix)
        // mat4.identity(modelmatrix)
        // mat4.translate(modelmatrix, modelmatrix, [config.meters.x, config.meters.y0, 0])
        // mat4.rotateZ(modelmatrix, modelmatrix, config.meters.a_gable)
        // mat4.scale(modelmatrix, modelmatrix, [config.meters.x, config.meters.y_gable, config.meters.z])
        // mat4.translate(modelmatrix, modelmatrix, [0, 0, -1])
        // mat4.rotateY(modelmatrix, modelmatrix, -Math.PI/2)
        // glutils.geomTransform(geom2, modelmatrix)

        mat3.identity(texmatrix)
        mat3.translate(texmatrix, texmatrix, [0, ywall/ytotal])
        mat3.scale(texmatrix, texmatrix, [1, ygable/ytotal])
        glutils.geomTexTransform(geom2, texmatrix)
        mat4.identity(modelmatrix)
        mat4.translate(modelmatrix, modelmatrix, [0, config.meters.y0, 0])
        mat4.rotateZ(modelmatrix, modelmatrix, -config.meters.a_gable)
        mat4.scale(modelmatrix, modelmatrix, [config.meters.x, config.meters.y_gable, config.meters.z])
        mat4.rotateY(modelmatrix, modelmatrix, Math.PI/2)
        glutils.geomTransform(geom2, modelmatrix)

        // roof:
        // mat3.identity(texmatrix)
        // mat3.translate(texmatrix, texmatrix, [0, (ywall+ygable)/ytotal])
        // mat3.scale(texmatrix, texmatrix, [1, yroof/ytotal])
        // glutils.geomTexTransform(geom3, texmatrix)
        // mat4.identity(modelmatrix)
        // mat4.translate(modelmatrix, modelmatrix, [config.meters.x_top, config.meters.y, 0])
        // mat4.rotateZ(modelmatrix, modelmatrix, Math.PI/2)
        // mat4.scale(modelmatrix, modelmatrix, [config.meters.x, config.meters.w_top, config.meters.z])
        // mat4.translate(modelmatrix, modelmatrix, [0, -1, -1])
        // mat4.rotateY(modelmatrix, modelmatrix, -Math.PI/2)
        // glutils.geomTransform(geom3, modelmatrix)

        mat3.identity(texmatrix)
        mat3.translate(texmatrix, texmatrix, [0, (ywall+ygable)/ytotal])
        mat3.scale(texmatrix, texmatrix, [1, yroof/ytotal])
        glutils.geomTexTransform(geom3, texmatrix)
        mat4.identity(modelmatrix)
        mat4.translate(modelmatrix, modelmatrix, [config.meters.x_top, config.meters.y, 0])
        mat4.rotateZ(modelmatrix, modelmatrix, -Math.PI/2)
        mat4.scale(modelmatrix, modelmatrix, [config.meters.x, config.meters.w_top, config.meters.z])
        mat4.translate(modelmatrix, modelmatrix, [0, 0, 0])
        mat4.rotateY(modelmatrix, modelmatrix, Math.PI/2)
        glutils.geomTransform(geom3, modelmatrix)


        glutils.geomAppend(geom, geom2)
        glutils.geomAppend(geom, geom3)
        left_wall_geom = geom
    }

    fs.writeFileSync("models/F.obj", glutils.geomToOBJ(floor_geom), "utf8")
    fs.writeFileSync("models/R.obj", glutils.geomToOBJ(right_wall_geom), "utf8")
    fs.writeFileSync("models/L.obj", glutils.geomToOBJ(left_wall_geom), "utf8")
    fs.writeFileSync("models/E.obj", glutils.geomToOBJ(far_wall_geom), "utf8")

}

let F = new App({
    title: "F",
    machine: common.machines.F,
    width: common.machines.F.content_res[0] / win_div, 
    height: common.machines.F.content_res[1] / win_div,
    pos: [0, 2582 / win_div],
    decorated,

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

let E = new App({
    title: "E",
    machine: common.machines.E,
    width: common.machines.E.content_res[0] / win_div, 
    height: common.machines.E.content_res[1] / win_div,
    pos: [3840 / win_div, 2582 / win_div],
    decorated,

    config: common.machines.E,
    senders: [
         { name: "EF", dim: [16, 1872], pos: [0, 0] },
        { name: "EL", dim: [1272, 16], pos: [0, 1872-16] },
         { name: "ET", dim: [16, 406], pos: [1752-16, (1872 - 406)/2] },
        { name: "ER", dim: [1272, 16], pos: [0, 0] },
    ],
    receivers: [
        { name: "FE", dim: [16, 1872], pos: [overlap-16, 0], angle: 0 },
        { name: "LE", dim: [16, 2582], pos: [0, 1872], angle: -Math.PI/2 },
        { name: "LE", dim: [16, 2582], pos: [590, 2970], angle: -2.57 },
        { name: "LE", dim: [16, 2582], pos: [1752, 3305], angle: -Math.PI },
        { name: "RE", dim: [16, 2582], pos: [2582, overlap-16], angle: Math.PI/2 },
        { name: "RE", dim: [16, 2582], pos: [1985, 1070], angle: 2.57 },
    ],
}, common)

let L = new App({
    title: "L",
    machine: common.machines.L,
    width: common.machines.L.content_res[0] / win_div, 
    height: common.machines.L.content_res[1] / win_div,
    pos: [0, 0],
    decorated,

    config: common.machines.L,
    senders: [
       { name: "LF", dim: [3840, 16], pos: [0, 0] },
       { name: "LR", dim: [3840, 16], pos: [0, 2582-16] },
        { name: "LE", dim: [16, 2582], pos: [3840-16, 0] },
    ],
    receivers: [
         { name: "FL", dim: [3840, 16], pos: [0, overlap-16], angle: 0 },
        { name: "EL", dim: [1272, 16], pos: [3840-overlap+16, 0], angle: Math.PI/2 },
        { name: "ET", dim: [16, 406], pos: [3840-overlap+16, 2582], angle: Math.PI },
         { name: "RL", dim: [3840, 16], pos: [0, 2582-overlap], angle: 0},
    ],
}, common)

let R = new App({
    title: "R",
    machine: common.machines.R,
    width: common.machines.R.content_res[0] / win_div, 
    height: common.machines.R.content_res[1] / win_div,
    pos: [0, (2582 + 1872) / win_div],
    decorated,

    config: common.machines.R,
    senders: [
       { name: "RF", dim: [3840, 16], pos: [0, 2582-16] },
        { name: "RE", dim: [16, 2582], pos: [3840-16, 0] },
        { name: "RL", dim: [3840, 16], pos: [0, 406+16] },
    ],
    receivers: [
        { name: "FR", dim: [3840, 16], pos: [0, 2582-overlap], angle: 0 },
        { name: "ER", dim: [1272, 16], pos: [3840-overlap, 2582], angle: -Math.PI/2 },
        { name: "ET", dim: [16, 406], pos: [3840-overlap, 0], angle: 0 },
        { name: "LR", dim: [3840, 16], pos: [0, 406+overlap], angle: 0},
    ],
}, common)

let P = new AppPreviz({
    title: "previz",
    width: 9600 / win_div,
    height: 8000 / win_div,
    pos: [5700/win_div, 50],

    sources: { L, R, F, E }
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