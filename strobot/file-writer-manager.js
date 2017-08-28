/**
 * Created by HJ on 2017/8/24.
 */

const util = require('./util/util')
const consumeType = require('./config/game-config.json').consumeType
const workQueue = []
let stop = false

let allWin = 0
let allCost = 0


exports.start = () => {

    util.writeLine(['robotIndex', 'round', 'win', 'cost'])

    const timer = setInterval(function () {

        if (workQueue.length > 0) {

            const writeHistroy = workQueue.splice(0, workQueue.length)
            util.writeHis2File(writeHistroy)
            // console.log('写入完毕, 共写入 : ', writeHistroy.length, ' 行数据')

            writeHistroy.map(function (x) {
                allWin += x[2]
                allCost += x[3]
            })

        }

        if (stop && workQueue.length === 0) {
            if (allCost > 0) {
                util.writeLine([allWin / allCost])
            }
            clearInterval(timer)
        }

    }, 1000)

}

exports.stop = () => {
    stop = true
}

module.exports.pushWork = (work) => {
    workQueue.push(work)
}

module.exports.pushHistory = (robotIndex, round, win, ctype) => {
    // const newRecord = {
    //     robotIndex: robotIndex,
    //     cost: consumeType[ctype],
    //     win: win,
    //     round: round
    // }
    workQueue.push([robotIndex, round, win, consumeType[ctype]])
}

