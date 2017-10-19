/**
 * Created by HJ on 2017/8/22.
 */

require('../../util/pomelo-cocos2d-js')
const Q = require('q')
const v1 = require('uuid/v1');
const Memory = require('../memory/managerRobotMemory')
const RobotAction = require('../action/managerRobotAction')
const Net = require('../robotNet')

function ManageRobot() {

    const pomelo = (new PP()).pomelo
    const net = new Net(pomelo)
    const action = new RobotAction(net, new Memory())

    this.id = v1()
    this.afterStop = null

    this.run = () => {

        try {

            logger.info('管理机器人【%s】号 => 开始工作', this.id)

            pomelo.on('changeRoomInfo', function (data) {
                action.dealWithRoomInfoChange(data)
            })

            pomelo.on('addRoom', function (data) {
                action.addRobotIntoNewRoom(data)
            })

            Q.spawn(function* () {
                yield action.connect()
                yield action.enterGame()
                yield action.addRobotsIntoInitEmptyRooms()
            }.bind(this))

        }

        catch (reason) {

            logger.error('管理机器人【%s】行动失败 , 原因: %s', this.id, reason)
            this.stop()

        }
    }

    this.stop = () => {
        action.disconnect()
        global.robotsInfo.stopAllRobots()
        if (this.afterStop && typeof this.afterStop === 'function') {
            this.afterStop()
        }
    }


}

module.exports = ManageRobot
