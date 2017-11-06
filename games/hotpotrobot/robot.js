/**
 * Created by HJ on 2017/8/22.
 */

require('../../util/pomelo-cocos2d-js')
const Q = require('q')
const RobotAction = require('./robotAction')
const Net = require('../../util/net')
const HotPotEvents = require('./hotPotEvents')

class Robot {

    constructor(room) {
        this.room = room
        const pomelo = (new PP()).pomelo
        const net = new Net(pomelo)
        this.hpEvents = new HotPotEvents(pomelo)
        this.action = new RobotAction(net)
    }

    run() {

        this.hpEvents.on('betting', function (data) {
            this.action.dealWithStartBetting(data)
        }.bind(this))

        this.hpEvents.on('win', function (data) {
            this.action.dealWithPlayResult(data)
        }.bind(this))

        this.action.initMemeory(this.room)

        logger.info('机器人【%s】号 => 开始工作', this.action.getId())

        Q.spawn(function* () {

            try {
                yield this.action.connect()
                global.robotsInfo.registerRef(this.action.getUid(), this)
                yield this.action.enterRoom(this.room)
            }
            catch (reason) {
                logger.error('机器人【%s】行动失败 , 原因: %s', 'managerRobot', reason)
                yield this.stop()
            }

        }.bind(this))

    }

    stop() {
        return Q.async(function* () {

            global.robotsInfo.removeRobot(this.room, this.action.getUid())

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

        }.bind(this))()
    }

    static createRobot(room) {
        return new Robot(room)
    }



}

module.exports = Robot


