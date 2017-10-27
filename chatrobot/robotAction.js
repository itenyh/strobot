/**
 * Created by HJ on 2017/8/23.
 */

const Q = require('q')
const v1 = require('uuid/v1');
const Memory = require('./memory')
const gameConfig = require('./config/game-config.json')
const EventEmitter = require('events')

function RobotAction(userName, net) {

    const memory = new Memory()
    const event = new EventEmitter()
    const netRequestInterval = 500

    this.initMemeory = function (room) {
        memory.type = global.rules.getRandomType()
        memory.id = v1().replace(/-/g, '') + '-' + room + '-' + memory.type
    }

    this.getId = function () {
        return memory.id
    }

    this.getUid = function () {
        return memory.uid
    }

    this.disconnect = () => {
        net.disconnect()
    }

    this.on = function (eventName, data) {
        event.on(eventName, data)
    }

    this.connect = Q.async(function* () {
        const room = 3

        yield net.asynReady({host: gameConfig.gameHost, port: gameConfig.gamePort})
        const data = yield net.asynQueryEntry(userName)
        // console.log(data)
        yield net.asynReady({host:data.host, port: data.port})
        yield net.asynEnter(room, userName)
        // yield net.asynChat(userName, '', 'hello', room)

    })




    this.play = Q.async(function* () {

        while (true) {

            const data1 = yield net.asynPlay()
            console.log(data1)
            yield Q.delay(3000)

        }

    })

    this.getRobotInfo = function () {
        return memory
    }

    this.leaveRoom2Game = Q.async(function* () {
        yield net.asynLeaveRoom2Game()
    })

    function caculatePay(gold) {

        let finalbet = -1
        let finalline = -1

        const lineNums = [9, 15, 25]
        const bets = [5, 25, 50, 250]
        const maxPay = gold * 0.95

        const lineNumsCat = lineNums.length
        const betsCat = bets.length

        for (let i = lineNumsCat - 1;i >= 0;i--) {
            for (let j = betsCat - 1;j >= 0;j--) {
                const tempPay = lineNums[i] * bets[j]
                if (tempPay <= maxPay) {
                    finalline = lineNums[i]
                    finalbet = bets[j]
                    return [finalline, finalbet]
                }
            }
        }

        return false

    }

    function addMoney(gold) {

        return Q.async(function* () {
            const result = yield net.asynAddMoney(memory.uid, gold)
            memory.gold = result.gold
        })()

    }


}

module.exports = RobotAction
