
const Q = require('q')

function a(cb) {
    cb(null, 1)
}

const asynA = Q.nbind(a)

asynA(function (a, b) {
    console.log(b)
})

