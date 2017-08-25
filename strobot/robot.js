/**
 * Created by HJ on 2017/8/22.
 */

require('./util/pomelo-cocos2d-js')
const consumeType = require('./config/game-config.json').consumeType
const playInterval = require('./config/game-config.json').playInterval
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
    this.index = -1
    this.playParams = config
    this.afterStop = null
    this.run = () => {

        logger.info('机器人【%s】号 => 开始工作', this.index)

        const params = this.playParams
        params.bet = consumeType[params.consumeType]

        action.connect().then(function (data) {
            return action.promisePlay2Die(playInterval, params, eggObj, function (data, i) {
                if (data) {
                    memory.addGameResult(data.win, params.consumeType)
                }
                logger.info('机器人【%s】号 => 工作进度（%s/%s）', this.index, i, params.playRound)
            }.bind(this))
        }.bind(this)).then(function () {
            return action.sendWork2Pipe(memory.history, pipe)
        }).then(function () {
            logger.info('机器人【%s】号 => 完成工作 ', this.index)
            this.stop()
        }.bind(this)).catch(function (reason) {
            logger.error('机器人【%s】行动失败 , 原因: %s', this.index, reason)
            this.stop()
        }.bind(this))

    }

    this.stop = () => {
        action.disconnect()
        if (this.afterStop && typeof this.afterStop === 'function') {
            this.afterStop()
        }
    }

}

module.exports = Robot


