var Random = require("random-js");
var random = new Random(Random.engines.mt19937().autoSeed());

function Rules() {

    const robotGoldLevel = {
        '1': 10000,
        '2': 50000,
        '3': 100000,
        '4': 1000000,
        '5': 2000000
    }

    this.getWait2PlayDurationSecondsInMill = function (win, gold) {
        if (win) {
            if (gold <= 10000) {
                return 20 * 1000
            }
            else {
                return random.integer(15, 20) * 1000
            }
        }

        else {
            return 10 * 1000
        }

    }

    this.getRandomAddedRobotNum = function () {
        return random.integer(2, 4)
    }

    this.getRandomAddedRobotIntervalMinuteInMill = function () {
        return random.integer(3, 5) * 60 * 1000
    }

    this.getRandomType = function () {
        return random.integer(1, 5)
    }

    this.getGold = function (type) {
        return robotGoldLevel[type]
    }

}

module.exports = Rules
