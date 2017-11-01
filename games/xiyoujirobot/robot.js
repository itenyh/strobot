/**
 * Created by HJ on 2017/8/22.
 */

const _Robot = require('../a777robot/robot')

class Robot extends _Robot {

    static createRobot(room) {
        const RobotAction = require('./robotAction')
        return new Robot(room, RobotAction)
    }

}

module.exports = Robot


