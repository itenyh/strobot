/**
 * Created by HJ on 2017/8/22.
 */

const Q = require('q')
const v1 = require('uuid/v1');
const Memory = require('./memory')
const RobotAction = require('./robotAction')

function Robot() {

    const memory = new Memory()
    const action = new RobotAction()

    this.id = v1()
    this.type = ''

    this.afterStop = null
    this.run = () => {

        logger.info('机器人【%s】号 => 开始工作', memory.index)

        const phoneNumber = '13461214999'
        const password = '1'

        const otherUID = '12309662'
        const beChild = false

        Q.spawn(function* () {

            try {
                const data = yield action.robotIdentitiyEnsure(phoneNumber, password)
                logger.info('我的uid: ', data.uid)
                yield action.connect(phoneNumber, password)
                yield action.scanUsersFindAwardUids(memory)
                // logger.info('尝试与 ', otherUID, ' 建立', beChild? '下级' : '非下级', '关系')
                // yield action.buildRelationWith(otherUID, beChild)
                logger.info('机器人【%s】号 => 完成工作 ', memory.index)
                this.stop()
            }
            catch (reason) {
                logger.error('机器人【%s】行动失败 , 原因: %s', memory.index, reason)
                this.stop()
            }

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


