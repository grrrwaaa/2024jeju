const fs = require("fs")
const path = require("path")
const exec = require('child_process').exec;



function gitpull() {
    let child = exec("git pull --no-edit", function(err, stdout, stderr){
        if(err != null){
            return console.error(new Error(err));
        }else if(typeof(stderr) != "string"){
            return console.error(new Error(stderr));
        }else{
            return console.log(stdout);
        }
    });
}

gitpull()
setTimeout(function() {
    gitpull()
}, 1*1000)