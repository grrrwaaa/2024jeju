const forever = require('forever-monitor');

const child = new (forever.Monitor)('render.js', {
    //silent: true,
    args: []
});

child.on('exit', function () {
    console.log('your-filename.js has exited after 3 restarts');
});

child.start();


// const pm2 = require('pm2')

// pm2.connect(function(err) {
//   if (err) {
//     console.error(err);
//     process.exit(2);
//   }
//   pm2.start([
//     {
//       script: "render.js",
//       output: "/dev/stdout",
//       error: "/dev/stderr",
//       watch: true,
        
//     // Specify delay between watch interval
//     watch_delay: 1000,

//     },
//   ]
//     , function(err, proc) {
//       if(err) {
//         throw err
//       }
//     });
// })