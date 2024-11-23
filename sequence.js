function load(s, time) {
    return Object.assign({
        _time: time,
        _filename: s,
    }, new Function(fs.readFileSync("sequence/" + s, "utf-8"))())
}

return {
    _seq: [
        load("ink.js", 0),
        load("descend.js", 60),
        load("blobs.js", 180),
        load("blobs_wild.js", 250),
        load("spinners.js", 360),
        load("hairy.js", 400),
        load("ascend.js", 480),
        load("storm.js", 580),
        load("end.js", 600),
    ]
}