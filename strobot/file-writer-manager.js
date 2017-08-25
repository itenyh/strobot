/**
 * Created by HJ on 2017/8/24.
 */

const util = require('./util')
const workQueue = []
let stop = false

exports.start = () => {

    const timer = setInterval(function () {

        if (workQueue.length > 0) {
            const work = workQueue.pop()
            // console.log('写入中...')
            util.writeHis2File(work)
            console.log('写入完毕, 共写入 : ', work.length, ' 行数据')
        }

        if (stop && workQueue.length === 0) {
            clearInterval(timer)
        }

    }, 1000)

}

exports.stop = () => {
    stop = false
}

module.exports.pushWork = (work) => {
    workQueue.push(work)
}