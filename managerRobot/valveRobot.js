/**
 * Created by HJ on 2017/8/22.
 */

const Q = require('q')
const RobotAction = require('./valveRobotAction')


function VavleRobot(nid) {

    this.action = new RobotAction(nid)

    this.run = () => {

        try {

            logger.info('【%s】管理机器人 => 开始工作', nid)

            this.action.addListener()

            Q.spawn(function* () {
                yield this.action.connect()
                yield this.action.enterGame()
                yield this.action.detectRoomInfo()
            }.bind(this))

        }

        catch (reason) {

            logger.error('【%s】管理机器人行动失败 , 原因: %s', nid, reason)
            this.action.stop()

        }
    }




}

module.exports = VavleRobot

