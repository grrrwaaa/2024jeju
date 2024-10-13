const assert = require("assert"),
	fs = require("fs"),
	os = require("os"),
	path = require("path")
const { Worker } = require('worker_threads')
const child_process = require('child_process');

const pnglib = require("pngjs").PNG

const { gl, glfw, glutils, Window, Shaderman } = require('anode_gl')

function dataFlipY(buf, width, height) {
    let buf1 = new Uint8Array(width*height*4)
    for (let y=0; y<height; y++) {
        for (let x=0; x<width; x++) {
            let idx = (y*width+x)*4
            let idx1 = ((height-1-y)*width+x)*4
            buf1[idx1+0] = buf[idx+0]
            buf1[idx1+1] = buf[idx+1]
            buf1[idx1+2] = buf[idx+2]
            buf1[idx1+3] = buf[idx+3]
        }
    }
    return buf1
}

function pngdata_write_nosync(filepath, data, width, height) {
    let png = new pnglib({
        width, height,
        //depth: 16, interlace: false, palette: false, color: false, alpha: true, bpp: 2, colorType: 4,   
    })
    png.data = texdata
    let dst = fs.createWriteStream(filepath);
    png.pack().pipe(dst);
}

function pngdata_write_sync(filepath, data, width, height) {
    fs.writeFileSync(filepath, pnglib.sync.write({
        width, height,
        //depth: 16, interlace: false, palette: false, color: false, alpha: true, bpp: 2, colorType: 4,
        data: texdata
    }))
}

function pngfile2base64string(filepath) {
    return "data:image/png;base64," + fs.readFileSync(filepath).toString('base64')
}

function pngfile2texture(filepath, tex, flip) {
    let png = pnglib.sync.read(fs.readFileSync(filepath))
    // copy into the texture:
    //tex.data.set(png.data);
    // or just replace:
    tex.width = png.width
    tex.height = png.height
    tex.data = flip ? dataFlipY(png.data, png.width, png.height) : png.data
    tex.bind().submit().unbind()
}


function base64string2pngfile(filepath, str) {
    // it is base64 encoded PNG data
    let buf = Buffer.from(str, "base64")
    fs.writeFileSync(filepath, buf);
}

function texturedata2base64string(texdata, width, height, flipY) {
    if (flipY) texdata = dataFlipY(texdata, width, height)
    
    return "data:image/png;base64," + pnglib.sync.write({
        width, height,
        //depth: 16, interlace: false, palette: false, color: false, alpha: true, bpp: 2, colorType: 4,
        data: texdata
    }).toString('base64')
}


function texturedata2png_nosync(filepath, texdata, width, height) {
    let png = new pnglib({
        width, height,
        //depth: 16, interlace: false, palette: false, color: false, alpha: true, bpp: 2, colorType: 4,
        
    })
    png.data = texdata
    let dst = fs.createWriteStream(filepath);
    png.pack().pipe(dst);
}

function texturedata2png(filepath, texdata, width, height, flip=false) {
    // let pngdata = pnglib.sync.write({
    //     width, height,
    //     //depth: 16, interlace: false, palette: false, color: false, alpha: true, bpp: 2, colorType: 4,
    //     data: texdata
    // }).toString('base64')

    fs.writeFileSync(filepath, pnglib.sync.write({
        width, height,
        //depth: 16, interlace: false, palette: false, color: false, alpha: true, bpp: 2, colorType: 4,
        data: flip ? dataFlipY(texdata, width, height) : texdata
    }))
}

function texture2base64string(tex) {
    return "data:image/png;base64," + pnglib.sync.write({
        width: tex.width, height: tex.height,
        //depth: 16, interlace: false, palette: false, color: false, alpha: true, bpp: 2, colorType: 4,
        data: tex.data
    }).toString('base64')
}

function base64string2data(str) {
    // it is base64 encoded PNG data
    let buf = Buffer.from(str, "base64")
    let png = pnglib.sync.read(buf)
    return png.data
}

function base64string2texture(tex, str) {
    // it is base64 encoded PNG data
    let buf = Buffer.from(str, "base64")
    let png = pnglib.sync.read(buf)
    // copy into the texture:
    //tex.data.set(png.data);
    // or just replace:
    tex.width = png.width
    tex.height = png.height
    tex.data = png.data
    tex.bind().submit().unbind()

    return buf // in case you want to fs.writeFileSync(pngfile, buf);
}

function png2tex(gl, pngpath, flipY) {
	let img = pnglib.sync.read(fs.readFileSync(pngpath))
	let tex = glutils.createPixelTexture(gl, img.width, img.height)
	tex.data = flipY ? dataFlipY(img.data, img.width, img.height) : img.data
	tex.bind().submit()
	gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.REPEAT);
	gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.REPEAT);
	gl.generateMipmap(gl.TEXTURE_2D);
	tex.unbind();
	return tex
}

function jpg2tex(gl, path, flipY) {
	const fs = require("fs");
	const jpeg = require('jpeg-js');

	let jpg = jpeg.decode(fs.readFileSync(path));
	let tex = glutils.createPixelTexture(gl, jpg.width, jpg.height)
	assert(tex.data.length == jpg.data.length);
	tex.data = flipY ? dataFlipY(jpg.data, jpg.width, jpg.height) : jpg.data
	tex.bind().submit()
	gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
	gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
	tex.unbind();

	return tex;
}


module.exports = {
    texturedata2png_nosync,


    base64string2pngfile, 
    base64string2texture,
    base64string2data,

    pngfile2base64string,
    pngfile2texture, 

    texturedata2base64string, 
    texturedata2png, 

    texture2base64string, 

    png2tex, jpg2tex,
    dataFlipY,
}