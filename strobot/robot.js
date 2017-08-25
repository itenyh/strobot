/**
 * Created by HJ on 2017/8/22.
 */

require('./pomelo-cocos2d-js')
const v1 = require('uuid/v1');
const Memory = require('./memory')
const Egg = require('./eggpush')
const RobotAction = require('./robotAction')
const pipe = require('./file-writer-manager')

function Robot(config) {

    const pomelo = (new PP()).pomelo
    const memory = new Memory()
    const eggObj = new Egg()
    const action = new RobotAction(pomelo)

    this.id = v1()
    this.playParams = config
    this.run = () => {

        const params = this.playParams

        action.connect().then(function () {
            return action.createPlay(100, params, eggObj, function (data) {
                if (data) {
                    memory.addGameResult(data.win, params.consumeType)
                }
            })
        }).then(function () {
            return action.sendWork2Pipe(memory.history, pipe)
        }).then(function () {
            stop()
        })

    }

    function stop() {
        action.disconnect()
    }

}

module.exports = Robot


