

const Q = require('q')
const ChainOperation = require('../util/chainOperation')

const op = ChainOperation.chain(10, 0, function* () {
    console.log(1)
})
