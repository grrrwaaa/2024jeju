const fs = require("fs")
const forever = require('forever-monitor');

let changed = 0

let child = new (forever.Monitor)('render.js', {
    //silent: true,
    args: []
});
child.on('exit', function () {
    console.log('exit');
});

setInterval(function() {
    if (changed) {
        child.kill()
        changed = 0
    }
}, 1000)

child.start();

fs.watch(".", (eventType, filename) => {
    console.log('File "' + filename + '" was changed: ' + eventType);

    changed = 1
});
