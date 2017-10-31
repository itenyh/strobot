

const inherits = require('util').inherits
const Rob = require('./test1')

class NRob extends Rob {

   constructor(a) {
       super(a)
   }

}
inherits(NRob, Rob)

// const nb = new NRob()
// console.log(nb.a)
// console.log(nb.b)
// // nb.m1()
// nb.m2()
// nb.m3()

const rob = new Rob(5)
console.log(rob.a)
rob.m1()