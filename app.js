const fs = require("fs")
const path = require("path")
const exec = require('child_process').exec;

const { vec2, vec3, vec4, quat, mat2, mat2d, mat3, mat4} = require("gl-matrix")

const { gl, glfw, glutils, Window, Shaderman } = require("../anode_gl/index.js")
const ndi = require("../anode_ndi/index.js")
const ndi_texture = require("./ndi.js")
const Params = require("./params.js")
const server = require("./server.js")

let monitors = glfw.getMonitors()
for (let monitor of monitors) {
    let mode = glfw.getVideoMode(monitor)
    console.log(`monitor ${mode.width}x${mode.height}, ${mode.refreshRate}`)
}

let screenshot = 0
let shaderman
let show = 1
let seconds = 0

let SEND_PHYS = 0
let SEND_FLOAT = 0
let SEND_RATE_DIV = 3

function gitpull() {
    // let child = exec("git pull --no-edit", function(err, stdout, stderr){
    //     if(err != null){
    //         return console.error(new Error(err));
    //     }else if(typeof(stderr) != "string"){
    //         return console.error(new Error(stderr));
    //     }else{
    //         return console.log(stdout);
    //     }
    // });
}

class App extends Window {

    constructor(options, common) {
        super(options)

        // have to manually install this:
        this.draw = App.prototype.draw
        this.onkey = App.prototype.onkey

        let wall_flat_geom

        this.wall_U = [0, 0, 0]

        console.log("app", options.width, options.height)

        if (1) {
            let div = 8
            let t1 = 0.5
            let t2 = 0.835
            let s1 = 0.775
            let s2 = 0.42
            switch(this.title) {
                case "F": {
                    let geom = glutils.makeQuad3D({ div })
                    glutils.geomSetAllNormals(geom, [0, 1, 0])
                    glutils.geomAddColors(geom)
                    for (let i=0; i<geom.texCoords.length; i+=2) {
                        let j = i * 2
                        let u = geom.texCoords[i]
                        let v = geom.texCoords[i+1]
                        geom.colors[j+0] = 1-v
                        geom.colors[j+1] = 0
                        geom.colors[j+2] = 1-u
                        geom.colors[j+3] = 1
                    }
                    wall_flat_geom = geom
                    this.wall_U = [0, 0, -1]
                } break;
                case "E": {
                    let geom = glutils.makeQuad3D({ div })
                    glutils.geomSetAllNormals(geom, [0, 0, 1])
                    glutils.geomAddColors(geom)
                    for (let i=0; i<geom.texCoords.length; i+=2) {
                        let j = i * 2
                        let u = geom.texCoords[i]
                        let v = geom.texCoords[i+1]
                        geom.colors[j+0] = 1-v
                        geom.colors[j+1] = u
                        geom.colors[j+2] = 0
                        geom.colors[j+3] = 1
                    }
                    wall_flat_geom = geom
                    this.wall_U = [0, 1, 0]
                } break;
                case "L": {
                    let texmatrix = mat3.create()
                    
                    let geom1 = glutils.makeQuad3D({ min: [-1, -1], max: [1, t1*2-1], div })
                    glutils.geomAddColors(geom1)
                    for (let i=0; i<geom1.texCoords.length; i+=2) {
                        let j = i * 2
                        let u = geom1.texCoords[i]
                        let v = geom1.texCoords[i+1]
                        geom1.colors[j+0] = 0
                        geom1.colors[j+1] = v*s1
                        geom1.colors[j+2] = 1-u
                        geom1.colors[j+3] = 1
                    }
                    mat3.identity(texmatrix)
                    mat3.translate(texmatrix, texmatrix, [0, 0])
                    mat3.scale(texmatrix, texmatrix, [1, t1])
                    glutils.geomTexTransform(geom1, texmatrix)
                    glutils.geomSetAllNormals(geom1, [1, 0, 0])
                    
                    let geom2 = glutils.makeQuad3D({ min: [-1, t1*2-1], max: [1, t2*2-1], div  })
                    glutils.geomAddColors(geom2)
                    for (let i=0; i<geom2.texCoords.length; i+=2) {
                        let j = i * 2
                        let u = geom2.texCoords[i]
                        let v = geom2.texCoords[i+1]
                        geom2.colors[j+0] = v*s2
                        geom2.colors[j+1] = s1+v*(1-s1)
                        geom2.colors[j+2] = 1-u
                        geom2.colors[j+3] = 1
                    }
                    mat3.identity(texmatrix)
                    mat3.translate(texmatrix, texmatrix, [0, t1])
                    mat3.scale(texmatrix, texmatrix, [1, t2-t1])
                    glutils.geomTexTransform(geom2, texmatrix)
                    glutils.geomSetAllNormals(geom2, vec3.normalize([0, 0, 0], [1, -2, 0]))
                    
                    let geom3 = glutils.makeQuad3D({ min: [-1, t2*2-1], max: [1, 1], div  })
                    glutils.geomAddColors(geom3)
                    for (let i=0; i<geom3.texCoords.length; i+=2) {
                        let j = i * 2
                        let u = geom3.texCoords[i]
                        let v = geom3.texCoords[i+1]
                        geom3.colors[j+0] = s2 + v*(1-s2 - s2)
                        geom3.colors[j+1] = 1
                        geom3.colors[j+2] = 1-u
                        geom3.colors[j+3] = 1
                    }
                    mat3.identity(texmatrix)
                    mat3.translate(texmatrix, texmatrix, [0, t2])
                    mat3.scale(texmatrix, texmatrix, [1, 1-t2])
                    glutils.geomTexTransform(geom3, texmatrix)
                    glutils.geomSetAllNormals(geom3, [0, -1, 0])

                    let geom = glutils.geomAppend(geom1, glutils.geomAppend(geom2, geom3))
                    wall_flat_geom = geom
                    this.wall_U = [0, 0, -1]
                } break;
                case "R": {
                    let texmatrix = mat3.create()
                    let geom1 = glutils.makeQuad3D({ min: [-1, 1-t1*2], max: [1, 1], div  })
                    glutils.geomAddColors(geom1)
                    for (let i=0; i<geom1.texCoords.length; i+=2) {
                        let j = i * 2
                        let u = geom1.texCoords[i]
                        let v = geom1.texCoords[i+1]
                        geom1.colors[j+0] = 1
                        geom1.colors[j+1] = s1*(1-v)
                        geom1.colors[j+2] = 1-u
                        geom1.colors[j+3] = 1
                    }
                    mat3.identity(texmatrix)
                    mat3.translate(texmatrix, texmatrix, [0, 1-t1])
                    mat3.scale(texmatrix, texmatrix, [1, 1-t1])
                    glutils.geomTexTransform(geom1, texmatrix)
                    glutils.geomSetAllNormals(geom1, [-1, 0, 0])

                    let geom2 = glutils.makeQuad3D({ min: [-1, 1-t2*2], max: [1, 1-t1*2], div  })
                    glutils.geomAddColors(geom2)
                    for (let i=0; i<geom2.texCoords.length; i+=2) {
                        let j = i * 2
                        let u = geom2.texCoords[i]
                        let v = geom2.texCoords[i+1]
                        geom2.colors[j+0] = 1-(1-v)*s2
                        geom2.colors[j+1] = s1 + (1-v)*(1-s1)
                        geom2.colors[j+2] = 1-u
                        geom2.colors[j+3] = 1
                    }
                    mat3.identity(texmatrix)
                    mat3.translate(texmatrix, texmatrix, [0, 1-t2])
                    mat3.scale(texmatrix, texmatrix, [1, t2-t1])
                    glutils.geomTexTransform(geom2, texmatrix)
                    glutils.geomSetAllNormals(geom2, vec3.normalize([0, 0, 0], [-1, -2, 0]))
                    
                    let geom3 = glutils.makeQuad3D({ min: [-1, -1], max: [1, 1-t2*2], div  })
                    glutils.geomAddColors(geom3)
                    for (let i=0; i<geom3.texCoords.length; i+=2) {
                        let j = i * 2
                        let u = geom3.texCoords[i]
                        let v = geom3.texCoords[i+1]
                        geom3.colors[j+0] = s2 + v*(1-s2 - s2)
                        geom3.colors[j+1] = 1
                        geom3.colors[j+2] = 1-u
                        geom3.colors[j+3] = 1
                    }
                    mat3.identity(texmatrix)
                    mat3.translate(texmatrix, texmatrix, [0, 0])
                    mat3.scale(texmatrix, texmatrix, [1, 1-t2])
                    glutils.geomTexTransform(geom3, texmatrix)
                    glutils.geomSetAllNormals(geom3, [0, -1, 0])

                    let geom = glutils.geomAppend(geom1, glutils.geomAppend(geom2, geom3))
                    wall_flat_geom = geom
                    this.wall_U = [0, 0, -1]
                } break;
                default: {
                    wall_flat_geom = glutils.makeQuad3D({div})
                    glutils.geomAddColors(geom)
                } break;
            }
            fs.writeFileSync(`models/${this.title}_flat.obj`, glutils.geomToOBJ(wall_flat_geom), "utf8")
        }

        wall_flat_geom = glutils.geomFromOBJ(fs.readFileSync(`models/${this.title}_flat.obj`, "utf8"))
        let wall_vao = glutils.createVao(gl, wall_flat_geom)
        
        shaderman = new Shaderman(gl)
        
        // i.e. are we the first window to be created? If so, create global resources:
        let fbo_coords = glutils.makeGbuffer(gl, options.config.content_res[0], options.config.content_res[1], [
            { float: true, mipmap: false, wrap: gl.CLAMP_TO_EDGE }, // spherical
            { float: true, mipmap: false, wrap: gl.CLAMP_TO_EDGE }, // normal 
        ])
        // create coordinates:
        fbo_coords.begin()
        {
            let { width, height } = fbo_coords
            gl.viewport(0, 0, width, height);
            gl.clearColor(0, 0, 0, 0)
            gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
            gl.enable(gl.DEPTH_TEST)
            shaderman.shaders.coords.begin()
            .uniform("u_wall_u", this.wall_U)
            wall_vao.bind().draw()
        }
        fbo_coords.end()

        let fbo = glutils.makeGbufferPair(gl, options.config.content_res[0], options.config.content_res[1], [
            { float: true, mipmap: false, wrap: gl.CLAMP_TO_EDGE }, 
        ])
        let physarum_fbo = glutils.makeGbufferPair(gl, options.config.content_res[0], options.config.content_res[1], [
            { float: true, mipmap: false, wrap: gl.CLAMP_TO_EDGE }, 
        ])

        let send_fbo = glutils.makeGbuffer(gl, fbo.width, fbo.height, [
            { float: false, mipmap: false, wrap: gl.CLAMP_TO_EDGE }, 
        ])

        let final_fbo = glutils.makeGbuffer(gl, fbo.width, fbo.height, [
            { float: false, mipmap: false, wrap: gl.CLAMP_TO_EDGE }, 
        ])

        console.log("content", options.config.content_res)

        this.senders.forEach(send => {
            if (send.name[2] == "*") {
                send.data = new Uint8Array(4 * 4 * send.dim[0] * send.dim[1])
            } else {
                send.data = new Uint8Array(4 * (SEND_FLOAT ? 4 : 1) * send.dim[0] * send.dim[1])
            }
        })

        this.receivers.forEach(recv => {
            if (recv.name[2] == "*") {
                recv.tex = glutils.createTexture(gl, { float: true, width: recv.dim[0], height: recv.dim[1] }).allocate().bind().submit()
            } else {
                recv.tex = glutils.createTexture(gl, { float: SEND_FLOAT, width: recv.dim[0], height: recv.dim[1] }).allocate().bind().submit()
            }

            server.requestService(recv.name, recv.tex.data)
        })

        
        let sequence = common.sequence || new Params("sequence.js")
        common.sequence = sequence


        // VAOs can't be shared between windows, so we have to create one per window:
        Object.assign(this, { 
            wall_vao,
            quad_vao: glutils.createVao(gl, glutils.makeQuad()),
            unit_quad_vao: glutils.createVao(gl, glutils.makeQuad({ min: 0, max: 1 })),
            fbo_coords, send_fbo, fbo, physarum_fbo, final_fbo, 

            room_geom: glutils.geomFromOBJ(fs.readFileSync(`models/${this.title}.obj`, "utf8"), { soup: true }),

            common,
            unique: Math.random(),
            sequence,
        })

        common.allapps[options.title] = this

    
        // special case for floor:
        if (this.title == "F") {

            gitpull()
            
            Object.assign(this, {
                // this is the lidar data stream over NDI:
                lidar_stream: ndi_texture(gl, "TOF_NDI"),
                // this is what the LiDAR feeds are written into:
                lidar_fbo: glutils.makeGbuffer(gl, ...common.lidar_dim, [
                    { float: false, mipmap: false, wrap: gl.BORDER }
                ]), 
                // this is the calibration geometry for it:
                lidar_vao: glutils.createVao(gl, glutils.geomFromOBJ(fs.readFileSync("models/lidar.obj", "utf8"), { soup: true })),

                // this is the filtered & processed lidar data
                lidar_filter_fbo: glutils.makeGbufferPair(gl, ...common.lidar_dim, [
                    { float: true, mipmap: false, wrap: gl.BORDER }
                ]), 
            })
        } else {
            server.requestJSON("Estate", { seconds: 0 })
        }
    }

    draw(gl) {
        let { t, dt, frame, dim, sequence } = this
        let [ width, height ] = dim
        let { quad_vao, wall_vao, unit_quad_vao, fbo_coords, send_fbo, fbo, physarum_fbo, final_fbo } = this
        let { senders, receivers } = this
        let { lidar_stream, lidar_fbo, lidar_filter_fbo, lidar_vao } = this


        const isFloor = (this.title == "F");
        const isExit = (this.title == "E")

        seconds += dt

        if (isExit) {
            // getTime() gives ms since epoch
            // wrap it in the duration:
            seconds = (t + sequence._duration + this.common.timeoffset) % sequence._duration //this.common.seconds || (new Date().getTime() / 1000) % sequence._duration
            
            this.common.seconds = seconds
            const state = { seconds }
            server.sendData("Estate", "\0"+JSON.stringify(state))
            server.sendMax(state)
        } else {
            let state = server.getData("Estate")
            if (state && state.dst) seconds = state.dst.seconds
        }
        // update parameters:
        sequence.step(seconds)

        // special case for floor:
        if (isFloor) {
            // only process lidar input if we received data:
            if (lidar_stream.frame) {
                lidar_stream.frame = 0

                // first, use the calibration .obj geometry to resample the texture
                lidar_fbo.begin()
                {
                    let { width, height, data } = lidar_fbo
                    gl.viewport(0, 0, width, height)
                    gl.clearColor(0, 0, 0, 1)
                    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
                    gl.enable(gl.DEPTH_TEST)

                    lidar_stream.tex.bind().submit()
                    // using NEAREST to avoid blending of invalid pixel data
                    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
                    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
                    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_BORDER);
                    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_BORDER);
                    shaderman.shaders.show.begin()
                    lidar_vao.bind().draw()
                }
                lidar_fbo.end()

                // next, send this through a feedback process:
                lidar_filter_fbo.begin()
                {
                    let { width, height, data } = lidar_filter_fbo
                    gl.viewport(0, 0, width, height)
                    gl.clearColor(0, 0, 0, 1)
                    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
                    gl.enable(gl.DEPTH_TEST)

                    lidar_filter_fbo.bind(0, 0)
                    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
                    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
                    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
                    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);

                    lidar_fbo.bind(0, 1)
                    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
                    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
                    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
                    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);

                    shaderman.shaders.lidar_filter.begin()
                    .uniform("u_tex0", 0)
                    .uniform("u_tex_input", 1)
                    .uniform("u_seconds", seconds)
                    .uniform("u_resolution", [width, height])
                    quad_vao.bind().draw()
                }
                lidar_filter_fbo.end()
            }
        } 

        fbo.begin()
        {
            let { width, height } = fbo
            gl.viewport(0, 0, width, height);
            gl.clearColor(0, 0, 0, 0)
            gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
            gl.enable(gl.DEPTH_TEST)
            // gl.enable(gl.BLEND);
            // gl.blendFunc(gl.SRC_ALPHA, gl.ONE);
            gl.depthMask(false)

            fbo.bind()
            // using this one to reduce weird artefacts at edges
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.MIRRORED_REPEAT);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.MIRRORED_REPEAT);
            // gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
            // gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);

            if (isFloor) {
                lidar_filter_fbo.bind(0,1)
                gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.BORDER);
                gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.BORDER);
                gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
                gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
            }
            
            fbo_coords.bind(0, 2)
            fbo_coords.bind(1, 3)
            shaderman.shaders.demo.begin()
            //shaderman.shaders.verify.begin()
            .uniform("u_tex_lidar", 1)
            .uniform("u_tex_spherical", 2)
            .uniform("u_tex_normal", 3)
            .uniform("u_use_lidar", +isFloor)
            .uniform("u_seconds", seconds)
            .uniform("u_random", [Math.random(), Math.random(), Math.random(), Math.random()])
            .uniform("u_unique", this.unique)
            .uniform("u_wall_u", this.wall_U)
            .uniform("u_init", frame < 10 ? 1 : 0)
            .uniformsFrom(sequence)

            wall_vao.bind().draw()
            
            gl.disable(gl.BLEND)
            gl.depthMask(true)
        }
        fbo.end()

        
        //if (SEND_RATE_DIV <= 1 || (frame % SEND_RATE_DIV) == 0) 
        {
            if (!SEND_FLOAT) {
                send_fbo.begin()
                {
                    let { width, height } = send_fbo
                    gl.viewport(0, 0, width, height);
                    gl.clearColor(0, 0, 0, 0)
                    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
    
                    fbo.bind()
                    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
                    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
                    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
                    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
                    
                    shaderman.shaders.show.begin()
                    quad_vao.bind().draw()
                }
                send_fbo.end()
            }

            // spread the load:
            let send = senders[frame % senders.length]
           //senders.forEach(send => {
                let [x, y] = send.pos
                let [w, h] = send.dim
                if (send.name[2] == "*") {
                    gl.getTextureSubImage(physarum_fbo.readbuffer.textures[0], 0, x, y, 0, w, h, 1, gl.RGBA, gl.FLOAT, send.data.byteLength, send.data)
                } else if (SEND_FLOAT) {
                    gl.getTextureSubImage(fbo.readbuffer.textures[0], 0, x, y, 0, w, h, 1, gl.RGBA, gl.FLOAT, send.data.byteLength, send.data)
                } else {
                    gl.getTextureSubImage(send_fbo.textures[0], 0, x, y, 0, w, h, 1, gl.RGBA, gl.UNSIGNED_BYTE, send.data.byteLength, send.data)
                }
                
                //console.log("sending")
                server.sendData(send.name, send.data)
           // })
        }

        // first, overlay in the receivers:
        fbo.begin()
        {
            let { width, height } = fbo
            gl.viewport(0, 0, width, height);
            gl.clearColor(0, 0, 0, 0)
            gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
            gl.enable(gl.DEPTH_TEST)
            gl.depthMask(false)

            // old frame:
            fbo.bind()
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.REPEAT);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.REPEAT);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
            
            shaderman.shaders.show.begin()
            quad_vao.bind().draw()

            // new inputs
            // no particular need to condition this one.
            //if (SEND_RATE_DIV <= 1 || (frame % SEND_RATE_DIV) == 0) 
            {
                receivers.forEach(recv => {

                    if (recv.name[2] == null && server.getData(recv.name).frame) 
                    {
                        
                        let [w, h] = recv.dim
                        let [x, y] = recv.pos
                        let a = recv.angle

                        recv.tex.bind().submit()
                        
                        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
                        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
                        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
                        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);

                        let modelmatrix = mat4.create()
                        let projmatrix = mat4.create()

                        //mat4.frustum(projmatrix, 0, fbo.width, 0, fbo.height, -1, 1)
                        mat4.ortho(projmatrix, 0, fbo.width, 0, fbo.height, 0, 1)

                        mat4.translate(modelmatrix, modelmatrix, [x, y, 0])
                        mat4.rotateZ(modelmatrix, modelmatrix, a)
                        mat4.scale(modelmatrix, modelmatrix, [w, h, 1])


                        shaderman.shaders.pixelrect.begin()
                        .uniform("u_modelmatrix", modelmatrix)
                        .uniform("u_projmatrix", projmatrix)
                        .uniform("u_rot", a)
                        unit_quad_vao.bind().draw()
                    }
                })
            }

            
            gl.disable(gl.BLEND)
            gl.depthMask(true)
        }
        fbo.end()

        physarum_fbo.begin()
        {
            let { width, height } = fbo
            gl.viewport(0, 0, width, height);
            gl.clearColor(0, 0, 0, 0)
            gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
            gl.enable(gl.DEPTH_TEST)
            gl.depthMask(false)

            fbo.bind(0, 1)
            // using this one to reduce weird artefacts at edges
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.MIRRORED_REPEAT);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.MIRRORED_REPEAT);
            // gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
            // gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);

            fbo_coords.bind(0, 2)
            fbo_coords.bind(1, 3)
            physarum_fbo.bind()
                gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.REPEAT);
                gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.REPEAT);
                gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.MIRRORED_REPEAT);
                gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.MIRRORED_REPEAT);
                gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
                gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);


            shaderman.shaders.physarum.begin()
            .uniform("u_tex_fluid", 1)
            .uniform("u_tex_spherical", 2)
            .uniform("u_tex_normal", 3)
            .uniform("u_random", [Math.random(), Math.random(), Math.random(), Math.random()])
            .uniform("u_unique", this.unique)
            .uniform("u_wall_u", this.wall_U)
            .uniform("u_seconds", seconds)
            //.uniform("u_init", +(frame < 1))
            .uniformsFrom(sequence)
            wall_vao.bind().draw()

            {
                receivers.forEach(recv => {

                    if (recv.name[2] == "*" && server.getData(recv.name).frame) 
                    {
                        let [w, h] = recv.dim
                        let [x, y] = recv.pos
                        let a = recv.angle

                        recv.tex.bind().submit()
                        
                        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
                        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
                        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
                        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);

                        let modelmatrix = mat4.create()
                        let projmatrix = mat4.create()

                        //mat4.frustum(projmatrix, 0, fbo.width, 0, fbo.height, -1, 1)
                        mat4.ortho(projmatrix, 0, fbo.width, 0, fbo.height, 0, 1)

                        mat4.translate(modelmatrix, modelmatrix, [x, y, 0])
                        mat4.rotateZ(modelmatrix, modelmatrix, a)
                        mat4.scale(modelmatrix, modelmatrix, [w, h, 1])


                        shaderman.shaders.physrect.begin()
                        .uniform("u_modelmatrix", modelmatrix)
                        .uniform("u_projmatrix", projmatrix)
                        .uniform("u_rot", a)
                        unit_quad_vao.bind().draw()
                    }
                })
            }

            gl.disable(gl.BLEND)
            gl.depthMask(true)
        }
        physarum_fbo.end()
        
        final_fbo.begin()
        {
            let { width, height } = send_fbo
            gl.viewport(0, 0, width, height);
            gl.clearColor(0, 0, 0, 0)
            gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

            fbo.bind()
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);

            physarum_fbo.bind(0, 1)
            fbo_coords.bind(0, 2)
            fbo_coords.bind(1, 3)
            
            shaderman.shaders.final.begin()
            .uniform("u_tex_physarum", 1)
            .uniform("u_tex_spherical", 2)
            .uniform("u_tex_normal", 3)
            .uniform("u_wall_u", this.wall_U)
            .uniform("u_seconds", seconds)
            .uniformsFrom(sequence)
            //quad_vao.bind().draw()
            wall_vao.bind().draw()
        }
        final_fbo.end()

        gl.viewport(0, 0, width, height);
        gl.clearColor(0, 0, 0, 0)
        gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
        gl.enable(gl.DEPTH_TEST)

        final_fbo.bind()
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
        // if (this.isFLoor) {
        //     lidar_filter_fbo.bind()
        //     gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
        //     gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
        //     gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
        //     gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
        // }
        shaderman.shaders.render.begin()
        .uniform("u_rotate", this.final_rotate)
        quad_vao.bind().draw()
        
        if (Math.floor(t+dt) > Math.floor(t)) {
            console.log(`${this.title}: fps ${Math.round(1/dt)} seconds ${Math.round(seconds)} ${sequence._name} (${Math.round(100 * sequence._time/sequence._duration)}%)`)
        }

        if (screenshot) {
            let x = 0, y = 0
            let [width, height] = dim
            let data = new Uint8Array(width*height*4)
            gl.readPixels(x, y, width, height, gl.RGBA, gl.UNSIGNED_BYTE, data)
            // // you could write this into a PNG file:
            const pnglib = require("pngjs").PNG
            let filename = `screenshot.png`
            fs.writeFileSync(filename, pnglib.sync.write({
                width, height,
                data: dataFlipY(data, width, height)
            }))
            console.log("wrote", filename)
            screenshot = 0
        }
    }

    
    onkey(key, scan, down, mod) {
        let shift = mod % 2
        let ctrl = Math.floor(mod/2) % 2
        if (down) {

            switch(key) {
                case 70: { // f
                    this.setFullscreen(!this.fullscreen);
                    break;
                }
                case 83: {  //"s"
                    screenshot = 1
                } break;
            }

        }
    }

}

module.exports = App

if (require.main === module) {
    // this is the main script:
    let app = new App({
        title: "window0"
    })

    Window.syncfps = 60
    Window.animate()
}