const fs = require("fs")
const path = require("path")

function mix(a, b, t) {
    if (Array.isArray(a) && Array.isArray(b)) {
        return a.map((v, i) => v + t*(b[i]-v))
    } else if (typeof a == "number" && typeof b == "number") {
        return a + t*(b-a)
    } else {
        return (t<1) ? a : b
    }
}

class Preset {

    _path = ""
    _mtime = 0
    _default = {}
    _current = {}

    constructor(path) {
        // this.fade = 0
        // this.params = {}
        this.load(path)
    }

    load(filepath) {
        this._path = filepath
        console.log("loading", filepath)
        let ext = path.extname(this._path)
        let json = {}
        if (ext == ".js") {
            json = new Function(fs.readFileSync(this._path, "utf-8"))() 
        } else if (ext == ".json") {
            json = JSON.parse(fs.readFileSync(this.path))
        }

        this._duration = 0
        this._mtime = fs.statSync(this._path).mtimeMs
        this._count = 1
        Object.assign(this._current, json)

        // define properties:
        for (let k of Object.keys(this._current)) {
            // skip hidden names
            //if (k[0] == "_") continue;

            // install getter:
            Object.defineProperty(this, k, {
                get: function () { return this._current[k] },
                configurable: true
            });
        }


        return this
    }

    stage(i) {
        // this._stage = i
        // if (this._stage === undefined) return;
            
        // this._current = Object.assign({}, this._seq[(this._stage + this._count) % this._count])
    }


    step(time) {
        
        // watch for params reload:
        if (this._mtime != fs.statSync(this._path).mtimeMs) {
            this.load(this._path)
        }

        // if (this._stage != undefined) return;

        // // nothing to animate?
        // if (this._count < 2) {
        //     this._fade = 0
        //     Object.assign(this._current, this._default)
        //     return this
        // }

        // // get nearest datasets:
        // let from = this._seq.slice().reverse().filter(o => o._time <= time)[0] || this._first
        // let to = this._seq.filter(o => o._time > time)[0] || this._last
        // // set defaults:
        // from = Object.assign({}, this._default, from)
        // to = Object.assign({}, this._default, to)

        // if (time <= from._time) {
        //     this._fade = 0
        //     Object.assign(this._current, from)
        //     return this
        // } else if (time >= to._time) {
        //     this._fade = 1
        //     Object.assign(this._current, to)
        //     return this
        // } else if (to == from) {
        //     this._fade = 0
        //     this._current = Object.assign({}, to, this._current)
        //     return this
        // } else {
        //     // interpolate parameters:
        //     this._fade = (time - from._time)/(to._time - from._time)

        //     // for each parameter:
        //     for (let k of Object.keys(this._default)) {
        //         let a = from[k]
        //         let b = to[k]

        //         this._current[k] = mix(from[k], to[k], this._fade)
        //     }
        // }

        return this
    }
}

module.exports = Preset