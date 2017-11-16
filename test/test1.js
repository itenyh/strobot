

const Q = require('q')
const Operation = require('../util/chainOperation')
const op = new Operation(null, function () {

    Q.async(function* () {
        console.log(123)
        yield Q.delay(1400)
        console.log(456)
        yield Q.delay(2000)
        console.log('finish')
    })

})

op.start(0)