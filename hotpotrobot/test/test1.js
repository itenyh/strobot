
const Q = require('q')

const r = '--1--'
// console.log(r.replace(/-/g, '0'))

// const asynWork = Q.nbind(function (cb) {
//
//     setTimeout(function () {
//        cb(null, 'ok')
//     },1500)
//
// })
//
// try {
//
// }
// catch(error) {
//     console.log(error)
// }
// finally {
//     console.log(123)
//     throw '1'
// }

// Q.spawn(function* () {
//
//     while (true) {
//
//         console.log(123)
//         yield asynWork()
//         console.log(234)
//
//     }
//
// })

console.log('anther thing')

// const a = Q.async(function* () {
//
//     try {
//         const result = yield asynWork()
//         console.log(result)
//     }
//     catch(err) {
//         console.log(err)
//     }
//
// })
//
// a()

// Q.when(123, function (data) {
//     console.log(data)
// })

try {
    setTimeout(function () {
        throw 1
    }, 1000)
}
catch (e) {

}