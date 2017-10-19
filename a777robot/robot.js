/**
 * Created by HJ on 2017/8/22.
 */

require('../util/pomelo-cocos2d-js')
const Q = require('q')
const RobotAction = require('./robotAction')
const Net = require('../util/net')

function Robot(room) {

    const pomelo = (new PP()).pomelo
    const net = new Net(pomelo)
    this.action = new RobotAction(net)

    this.afterStop = null
    this.run = () => {

        this.action.initMemeory(room)

        logger.info('机器人【%s】号 => 开始工作', this.action.getId())

        Q.spawn(function* () {

            try {
                yield this.action.connect()
                global.robotsInfo.registerRef(this.action.getUid(), this)
                yield this.action.enterRoom(room)
                yield this.action.play()
            }
            catch (reason) {
                logger.error('机器人【%s】行动失败 , 原因: %s', this.action.getId(), reason)
                yield this.stop()
            }

        }.bind(this))

    }

    this.stop = Q.async(function* () {

        global.robotsInfo.removeRobot(room, this.action.getUid())

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



    this.getRobotInfo = function () {
        return action.getMemory

    }

}

module.exports = Robot


