/**
 * Created by HJ on 2017/8/22.
 */

const v1 = require('uuid/v1');
const Memory = require('./memory')
const RobotAction = require('./robotAction')

function Robot() {

    const memory = new Memory()
    const action = new RobotAction()

    this.id = v1()
    this.afterStop = null
    this.run = () => {

        logger.info('机器人【%s】号 => 开始工作', memory.index)

        const phoneNumber = '13368113912'
        const password = '1'

        action.robotIdentitiyEnsure(phoneNumber, password).then(function (user) {
            return action.connect(phoneNumber, password)
        }).then(function (data) {
            logger.info('机器人【%s】号 => 完成工作 ', memory.index)
            this.stop()
        }.bind(this)).catch(function (reason) {
            logger.error('机器人【%s】行动失败 , 原因: %s', memory.index, reason)
            this.stop()
        }.bind(this))

    }

    this.stop = () => {
        action.disconnect()
        if (this.afterStop && typeof this.afterStop === 'function') {
            this.afterStop()
        }
    }

    this.setIndex = (index) => {
        memory.index = index
    }

}

module.exports = Robot


