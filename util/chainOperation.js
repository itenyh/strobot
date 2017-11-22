
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

function ChainOperation(repeateTimes, generator) {

    let timerRef = null
    let delayPromise = null
    let cacelled = false
    let doneTimes = 0
    let initInterval = 0

    function doJob() {

        Q.spawn(function* () {

            if (initInterval > 0) {
                yield delay(initInterval)
                initInterval = 0
            }

            if (continueable()) {

                const nextInterval = yield Q.async(generator)()
                doneTimes += 1
                if (continueable()) yield delay(nextInterval)
                doJob()

            }


        })

    }

    this.start = function (_initInterval) {

        initInterval = _initInterval
        doJob()

    }

    this.cancel = function () {

        cacelled = true

        if (timerRef) {

            clearTimeout(timerRef)

        }

        if (delayPromise) {

            delayPromise.resolve()

        }

    }

    function delay(ms) {

        var deferred = Q.defer();
        timerRef = setTimeout(deferred.resolve, ms);
        delayPromise = deferred
        return deferred.promise;

    }

    function continueable() {

        return !cacelled && (!repeateTimes || doneTimes < repeateTimes)

    }

}

function chain(repeat, initInterval, generator) {

    const op = new ChainOperation(repeat, generator)

    Q.spawn(function* () {

        yield Q.delay(0)
        op.start(initInterval)

    })

    return op

}

module.exports.Operation = Operation
module.exports.ChainOperation = ChainOperation
module.exports.chain = chain