/**
 * Created by HJ on 2017/8/23.
 */

require('../util/pomelo-cocos2d-js')

const Q = require('q')
const Net = require('./robotNet')
const gameConfig = require('./config/game-config.json')

//打断的error catch后抛出reject
//非打断的error catch后抛出resolve
function RobotAction() {

    const net = new Net((new PP()).pomelo)

    this.connect = () => {
        return net.asynReady({host: gameConfig.gameHost, port: gameConfig.gamePort}).then(function () {
            return net.asynLogin()
        }).then(function (data) {
            return net.asynReady({host: data.server.host, port: data.server.port}).thenResolve(data)
        }).then(function (data) {
            // 116.62.174.34
            return net.asynEnter(data.uid, data.token)
        }).catch(function (reason) {
            return Q.reject('所在 Action：connect， Action error reason: ' + JSON.stringify(reason))
        })
    }

    this.disconnect = () => {
        net.disconnect()
    }


}
module.exports = RobotAction
