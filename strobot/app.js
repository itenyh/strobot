/**
 * Created by HJ on 2017/8/24.
 */

const Robot = require('./robot')
const robotConfig = require('./user-config.json')

const maxConWorkingRobotNum = 10
const allRobotNum = 3

const robot = new Robot(robotConfig)
robot.run()