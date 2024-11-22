const forever = require('forever-monitor');

const child = new (forever.Monitor)('render.js', {
    //silent: true,
    args: []
});

child.on('exit', function () {
    console.log('your-filename.js has exited after 3 restarts');
});

child.start();