
const Q = require('q')
//
const asynWork = Q.nbind(function (cb) {

    setTimeout(function () {
       cb(null, 'ok')
    },1500)

})

// const a = Q.async(function* () {
//
//     const result = yield asynWork()
//     console.log(result)
//
// })
//
// a()

// Q.when(123, function (data) {
//     console.log(data)
// })