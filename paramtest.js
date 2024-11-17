let Params = require("./params.js")

let seq = new Params("./sequence.js")

console.log(seq.step(-1).test1)
console.log(seq.step(310).test1)
console.log(seq.step(600).test1)
console.log(seq.step(700).test1)
