
const Q = require('q')

function a(cb) {

    //do something
    cb(null)

}

const asynA = Q.nbind(a)

asynA().then(function () {
    throw new Error("Can't bar.");
    console.log(1)
}).catch(function (reason) {
    return Q.reject(123)
}).then(function () {
    console.log(2)
},function () {
    console.log(5)
}).catch(function () {
    console.log(4)
})