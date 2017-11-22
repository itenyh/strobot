var Random = require("random-js");
var random = new Random(Random.engines.mt19937().autoSeed());

function Rules() {

    const robotGoldLevel = {
        '1': 30000,
        '2': 50000,
        '3': 100000,
        '4': 1000000,
        '5': 2000000
    }

    this.lifeCheckInterval = 30 * 1000

    this.getWait2PlayDurationSecondsInMill = function (win, gold) {

        const extra = random.integer(1, 10) * 1000

        if (win) {
            if (gold <= 10000) {
                return 20 * 1000 + extra
            }
            else {
                return random.integer(15, 20) * 1000
            }
        }

        else {
            return 10 * 1000 + extra
        }

    }

    this.getTeaseDurationSecondsInMill = function () {
        return random.integer(5, 10) * 1000 * 60
        // return random.integer(5, 10) * 1000
    }

    this.timeout = function (entertime, lifelong) {
        return ((new Date()).getTime() - entertime) > lifelong
    }

    this.timeleft = function (entertime, lifelong) {
        return (lifelong - ((new Date()).getTime() - entertime))
    }

    this.lifecreate = function () {
        return 1 * 1000 * random.integer(3600, 3600 * 2)
    }

    this.getRandomType = function () {
        return random.integer(1, 5)
    }

    this.getRandomTease = function (tease) {
        const index = random.integer(0, tease.length - 1)
        return tease[index]
    }

    this.getGold = function (type) {
        return robotGoldLevel[type]
    }

}

module.exports = Rules
