/**
 * Created by HJ on 2017/8/24.
 */

const Q = require('q')

function a(cb) {

    const error = false

    console.log('do something')

    if (!error) {
        cb(null, 1)
    }

    else {
        cb(0)
    }

}

console.log(typeof a === 'function')

// const asynA = Q.nbind(a)
// asynA().then(function (data) {
//     console.log(data)
// })
// console.log(23423443)

// const as = [asynA]
// as.reduce(function (a, x, i) {
//     return a.then(function (data) {
//         if (i !== 0) {
//             console.log(data)
//             return Q.delay(1000).then(function () {
//                 return x()
//             })
//         }
//         else {
//             return x()
//         }
//     })
// }, Q.resolve()).then(function (data) {
//     console.log(data)
// })

// Q.all([asynA(), asynA()]).then(function (values) {
//     console.log(values)
// })

// asynA().then(function () {
//     return Q.delay(1000)
// }).then(function (data) {
//     console.log(data)
// })