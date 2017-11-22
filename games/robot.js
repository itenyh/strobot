/**
 * Created by HJ on 2017/8/22.
 */

const Q = require('q')

class Robot {

    constructor(room, action) {
        this.action = action
        this.action.addListener()
        this.action.initMemeory(room)
    }

    run() {

        logger.info('【%s】游戏机器人 => 开始工作', this.action.getId())

        Q.spawn(function* () {
            try {
                yield this.action.connect()
                yield this.action.enterGame()
                yield this.action.addInitMoney()
                this.action.emit('robotEnterGame')
                yield this.action.enterRoom()
                this.action.lifeCheck()
                // this.action.tease()
                this.action.play()
            }
            catch (reason) {
                logger.error('【%s】游戏机器人 => 行动失败 , 原因: %s Time: %s', this.action.getId(), reason, Date.now())
                this.action.stop()
            }
        }.bind(this))

    }


}

module.exports = Robot
