/**
 * Created by HJ on 2017/8/23.
 */
var Random = require("random-js");
var random = new Random(Random.engines.mt19937().autoSeed());

function Memory() {

    this.userAwardBin = {} //uid: {lastAwardTime, beans, leastAwardIntervalMin}
    this.index = 1

    this.createAwardUsers = () => {

        const nowTimeStamp = new Date().getTime()
        const uids = []
        for (binKey in this.userAwardBin) {
            const bin = this.userAwardBin[binKey]
            const lastAwardTime = bin.lastAwardTime
            const interval = (nowTimeStamp - lastAwardTime) / 1000
            if (interval > 60 * 5) {
                uids.push(binKey)
                this.userAwardBin[binKey] = createAwardBin(nowTimeStamp)
            }
        }
        return uids

    }

    //为新user生成发放奖品的时间与奖品，如果这个user已经存在：
    //如果userLastAwardTime不存在这个uid，则生成；如果userLastAwardTime和uid都存在，不用理会；如果userLastAwardTime存在，而uids不存在则删除
    this.updateUserAwardBin = (uids) => {

        const nowTimeStamp = new Date().getTime()

        for (uid of uids) {
            const lastAwardTime = this.userAwardBin[uid]
            if (!lastAwardTime) {
                this.userAwardBin[uid] = createAwardBin(nowTimeStamp)
            }
        }

        const  binKeys = Object.keys(this.userAwardBin)
        for (key of binKeys) {
            if (!uids.includes(key)) {
                delete this.userAwardBin[key]
            }
        }

        // console.log(this.userAwardBin)

    }

    function createAwardBin(nowTimeStamp) {
        const leastAwardIntervalMin = random.integer(1, 5);
        const leastAwardBeans = random.integer(1, 10);
        return  {leastAwardIntervalMin: leastAwardIntervalMin, leastAwardBeans: leastAwardBeans, lastAwardTime: nowTimeStamp}
    }

}

// const m = new Memory()
// const uids = ['1', '2', '3']
// m.updateUserAwardBin(uids)
// m.userAwardBin['1'].lastAwardTime -= 1000 * 60 * 10
// setTimeout(function () {
//     const r = m.createAwardUsers()
//     console.log(r, m.userAwardBin)
// }, 3000)


// console.log(m.userLastAwardTime.keys())

module.exports = Memory
