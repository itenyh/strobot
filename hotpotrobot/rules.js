var Random = require("random-js");
var random = new Random(Random.engines.mt19937().autoSeed());

function A777Rules() {

    const base = [
        {id: 'l1', name: '耗儿鱼'},
        {id: 'l2', name: '鸡爪'},
        {id: 'l3', name: '牛肉'},
        {id: 'l4', name: '香菜丸子'},
        {id: 'r1', name: '白菜'},
        {id: 'r2', name: '莲藕'},
        {id: 'r3', name: '黄瓜'},
        {id: 'r4', name: '香菇'},
        {id: 's1', name: '人参'},
        {id: 's2', name: '霸王蟹'},
    ];


    const group = [
        {id: 'l', name: '荤菜', odds: 2},
        {id: 'r', name: '素菜', odds: 2},
    ]

    const type = ['clever', 'dummy']
    const money = [10000, 50000, 100000, 500000, 1000000]

    this.getRandomBetElements = function (type, win, totalGold) {

        if (type == 'clever') {
            return getRandomCleverBetElements(win, totalGold)
        }
        else {
            return getRandomDummyBetElements(totalGold)
        }

    }

    const getRandomCleverBetElements = function (win, totalGold) {

        const bet = getBet4EachElement(totalGold)
        if (bet == 0) { return false }

        if (win) {

            const baseElements = randomList(base, random.integer(2, 4))
            const groupElements = randomList(group, 1)
            const elements = baseElements.concat(groupElements)

            const result = {}
            const infomation = []

            for (ele of elements) {
                result[ele.id] = bet
                infomation.push(ele.name)
            }

            return {'bets': result, 'total': elements.length * bet, 'info': infomation}

        }

        else {

            const minOddElement = [base[4]]
            const result = {}
            const infomation = []
            for (ele of minOddElement) {
                result[ele.id] = bet
                infomation.push(ele.name)
            }

            return {'bets': result, 'total': minOddElement.length * bet, 'info': infomation}

        }

    }
    
    const getRandomDummyBetElements = function (totalGold) {

        const num = random.integer(2, 4)
        const allElements = base.concat(group)
        const elements = randomList(allElements, num)

        const bet = getBet4EachElement(totalGold)

        if (bet == 0) { return false }

        const result = {}
        const infomation = []

        for (ele of elements) {
            result[ele.id] = bet
            infomation.push(ele.name)
        }

        return {'bets': result, 'total': elements.length * bet, 'info': infomation}

    }

    const getBet4EachElement = function (totalGold) {

        const maxEachBet = stripLowDigit(totalGold * 0.01, 2)
        const leastBet = 100

        return maxEachBet >= leastBet ? maxEachBet : 0

    }

    const stripLowDigit = function (num, count) {

        return Math.floor(0.01 * num) * Math.pow(10, count)

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

    this.isOnDealer = function (type) {
        if (type === 'dummy') {
            return true
        }
        else {
            // logger.info('clever 的机器人，有一半的几率上庄')
            return random.integer(0, 1) === 0
        }
    }

    this.isOffDealer = function (type, round, limitRound, winGold, gold) {
        if (type === 'dummy') {
            if (round === limitRound) {
                logger.info('机器人当庄达到上限 %s ，现在下庄', limitRound)
                return true
            }
            else {
                return round === limitRound
            }
        }
        else {
            if (winGold <= 0) {
                // logger.info('机器人输钱比率 %s', - winGold / gold)
                return (- winGold / gold) > 0.5
            }
            else {
                // logger.info('机器人赢钱比率 %s', winGold / gold)
                return (winGold / gold) > 0.3
            }
        }
    }

    this.isAble2OnDealer = function (gold) {
        return gold > 5000000
    }

    this.getRandomAddedRobotNum = function () {
        return random.integer(2, 4)
    }

    this.getRandomOffDealerNum = function () {
        return random.integer(2, 5)
    }

    this.getRandomAddedRobotIntervalMinuteInMill = function () {
        return random.integer(3, 5) * 60 * 1000
    }

    this.getRandomType = function () {
        return type[random.integer(0, type.length - 1)]
    }

    this.getRandomGold = function () {
        return money[random.integer(0, money.length - 1)]
    }

    const randomList = function (list, num) {
        const population = []
        for (let i = 0;i < list.length;i++) {
            population.push(i)
        }
        const rIndex = random.sample(population, num)
        const elements = []
        for (i of rIndex) {
            elements.push(list[i])
        }
        return elements
    }

}

module.exports = new A777Rules()

// const r = new A777Rules()

// console.log(r.getRandomLevel())

// this.getRandomAddedMoney = function (currentGold) {
//     let result = 0
//     if (currentGold < 10000) {}
//     else if (currentGold < 50000) {}
//     else if (currentGold < 100000) {}
//     else if (currentGold < 500000) {}
//     else if (currentGold < 1000000) {}
// }