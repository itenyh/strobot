/**
 * Created by HJ on 2017/8/24.
 */

const Q = require('q')

// function a(cb) {
//
//     for (let i = 0;i < 1000000000;i++) {
//         // console.log("in a :" + i)
//     }
//     cb(null, 'finish')
//
// }
//
// const asynA = Q.nbind(a)
// // asynA().then(function (data) {
// //     console.log(data)
// // })
// a(function (e, data) {
//     console.log(data)
// })
// console.log(3132131231231)

// function getApromise() {
//
//     return Q.promise(function (resolve, reject, notify) {
//
//         for (let i = 0;i < 1000000000;i++) {
//
//         }
//
//         resolve('finish')
//
//     })
//
// }
//
// getApromise().then(function (data) {
//     console.log(data)
// }, function (error) {
//
// }, function (progress) {
//
// })

String.prototype.fuck = function () {
    console.log('fuck')
}
