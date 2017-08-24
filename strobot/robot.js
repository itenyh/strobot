/**
 * Created by HJ on 2017/8/22.
 */

const action = require('./robotAction')

const Memory = require('./memory')
const memory = new Memory()
const util = require('./util')

const consumeType = {
    small: 20,
    middle: 100,
    large: 1000
}

const playParams = {

    eggConsumNum: 5,
    consumeType: 'small',
    playRound: 3,

}

action.connect().then(function () {
    return action.createPlay(playRound, 100, playParams, function (data) {
        if (data) {
            memory.addGameResult(data.win, consumeType[playParams.consumeType])
        }
    })
}).then(function () {

    console.log('写入中...')
    util.writeHis2File(memory.history)
    console.log('写入完毕, 共写入 : ', memory.history.length, ' 行数据')

})

