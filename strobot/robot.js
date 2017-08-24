/**
 * Created by HJ on 2017/8/22.
 */

const action = require('./robotAction')

const Memory = require('./memory')
const memory = new Memory()

function Robot(config) {

    this.playParams = config
    this.run = () => {

        const params = this.playParams
        action.connect().then(function () {
            return action.createPlay(params.playRound, 100, params, function (data) {
                if (data) {
                    memory.addGameResult(data.win, params.consumeType)
                }
            })
        }).then(function () {
            return action.writeHistory(memory.history)
        }).then(function () {
            stop()
        })

    }

    function stop() {
        action.disconnect()
    }

}

module.exports = Robot


