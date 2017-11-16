
const Q = require('q')

function Operation(repeateTimes, job) {

    let timerRef = null
    let repeatedTimes = 0
    function doJob(jobInter) {

        timerRef = setTimeout(function () {

            job(function (newJobInter) {

                repeatedTimes += 1
                if (!repeateTimes || repeatedTimes < repeateTimes) {
                    doJob(newJobInter)
                }

            })

        }, jobInter)


    }

    this.start = function (Interval) {

        doJob(Interval)

    }

    this.cancel = function () {

        clearTimeout(timerRef)

    }

}

// function PromiseOperation(repeateTimes, job) {
//
//     let timerRef = null
//     let repeatedTimes = 0
//     function doJob(jobInter) {
//
//         yield job()
//         yield delay(123)
//
//         // Q.async(function* () {
//         //
//         //     yield job()
//         //
//         // })
//
//         // timerRef = setTimeout(function () {
//         //
//         //     const j = job(function (newJobInter) {
//         //
//         //         repeatedTimes += 1
//         //         if (!repeateTimes || repeatedTimes < repeateTimes) {
//         //             doJob(newJobInter)
//         //         }
//         //
//         //     }).then(function () {
//         //
//         //     }, function (err) {
//         //
//         //         throw 2222222
//         //
//         //     })
//         //
//         // }, jobInter)
//
//
//     }
//
//     this.start = function (Interval) {
//
//         doJob(Interval)
//
//     }
//
//     this.cancel = function () {
//
//         clearTimeout(timerRef)
//
//     }
//
// }

function delay(ms) {
    var deferred = Q.defer();
    setTimeout(deferred.resolve, ms);
    return deferred.promise;
}

module.exports = Operation

