/**
 * Created by HJ on 2017/8/24.
 */

const Q = require('q')

global.logger = require('../../util/logger')
const PlayerRobot = require('./robot')

addRobot(100000)

function addRobot(num) {

    Q.spawn(function* () {

        for (let i = 0;i < num;i++) {

            const robot = new PlayerRobot(i + "jjjj")
            robot.run()
            console.log(i)
            yield Q.delay(500)

        }

    })

}

