/**
 * Created by HJ on 2017/8/24.
 */

global.logger = require('./util/logger')

const Robot = require('./robot')
const robotConfig = require('./config/user-config.json')

const maxConWorkingRobotNum = 10

const pipe = require('./file-writer-manager')
pipe.start()

// const robotPool = [new Robot(robotConfig), new Robot(robotConfig)]

let robotNum = robotConfig.robotNum
for (let i = 0;i < robotNum;i++) {

    const robot = new Robot(robotConfig)
    robot.index = i
    robot.afterStop = () => {
        robotNum--
        if (robotNum === 0) {
            pipe.stop()
        }
    }
    robot.run()

}