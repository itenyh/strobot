/**
 * Created by HJ on 2017/8/22.
 */

require('../../util/pomelo-cocos2d-js')
const Q = require('q')
const RobotAction = require('./robotAction')
const Net = require('./net')

function Robot(userName) {

    const pomelo = (new PP()).pomelo
    const net = new Net(pomelo)
    let hasConnected = false
    this.action = new RobotAction(userName, net)

    this.afterStop = null
    this.run = () => {

        pomelo.on('close', function (data) {
            if (hasConnected) {
                logger.error('机器人【%s】 socket close , 原因: %s %s', this.action.getId(), data.code, data.reason)
            }
        }.bind(this))

        // this.action.initMemeory(room)

        logger.info('机器人【%s】号 => 开始工作', this.action.getId())

        Q.spawn(function* () {
            try {
                yield this.action.connect()
                // yield this.action.addInitMoney()
                // hasConnected = true
                // global.robotsInfo.registerRef(this.action.getUid(), this)
                // yield this.action.enterRoom(room)
                yield this.action.play()
            }
            catch (reason) {
                logger.error('机器人【%s】行动失败 , 原因: %s', this.action.getId(), reason)
                yield this.stop()
            }

        }.bind(this))

    }

    this.stop = Q.async(function* () {

        this.action.disconnect()
        logger.info('机器人【%s】stop ', this.action.getId())
        if (this.afterStop && typeof this.afterStop === 'function') {
            this.afterStop()
        }

    })


}

module.exports = Robot


