/**
 * Created by HJ on 2017/8/24.
 */

const Robot = require('./robot')
const robotConfig = require('./user-config.json')

const maxConWorkingRobotNum = 10
const allRobotNum = 3

const pipe = require('./file-writer-manager')
pipe.start()

// const robotPool = [new Robot(robotConfig), new Robot(robotConfig)]

for (let i = 0;i < 2;i++) {

    const robot = new Robot(robotConfig)
    robot.run()

    // setTimeout(function () {
    //     const robot = new Robot(robotConfig)
    //     robot.run()
    // }, 500)

}