/**
 * Created by HJ on 2017/8/24.
 */

const Q = require('q')

global.logger = require('../util/logger')
const PlayerRobot = require('./robot')

addRobot(1)

function addRobot( num) {

    for (let i = 0;i < num;i++) {

        const robot = new PlayerRobot()
        robot.run()
        console.log(i)

    }

}
