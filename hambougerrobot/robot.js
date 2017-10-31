/**
 * Created by HJ on 2017/8/22.
 */

require('../util/pomelo-cocos2d-js')
const Q = require('q')
const RobotAction = require('./robotAction')

global.rules = require('./rules')

function Robot(room) {

   this.action = RobotAction.createRobotAction()

    this.afterStop = null
    this.run = () => {

        this.action.initMemeory(room)

        logger.info('机器人【%s】号 => 开始工作', this.action.getId())

        Q.spawn(function* () {
            try {
                yield this.action.connect()
                yield this.action.enterGame()
                yield this.action.addInitMoney()
                hasConnected = true
                yield this.action.enterRoom()
                yield this.action.play()
            }
            catch (reason) {
                logger.error('机器人【%s】行动失败 , 原因: %s', this.action.getId(), reason)
                yield this.stop()
            }

        }.bind(this))

    }

    this.stop = Q.async(function* () {

        try {
            yield this.action.leaveRoom2Game()
        }
        catch (reason) {
            logger.error('机器人【%s】stop 退出房间失败 , 原因: %s', this.action.getId(), reason)
        }

        this.action.disconnect()
        logger.info('机器人【%s】stop ', this.action.getId())
        if (this.afterStop && typeof this.afterStop === 'function') {
            this.afterStop()
        }

    })


}

module.exports = Robot


