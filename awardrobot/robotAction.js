/**
 * Created by HJ on 2017/8/23.
 */

require('../util/pomelo-cocos2d-js')

const Q = require('q')
const Net = require('./robotNet')
const gameConfig = require('./config/game-config.json')
const dbAction = require('./robotDb')

//打断的error catch后抛出reject
//非打断的error catch后抛出resolve
function RobotAction() {

    const net = new Net((new PP()).pomelo)

    this.disconnect = () => {
        net.disconnect()
    }

    this.connect = (phoneNumber, password) => {
        return net.asynReady({host: gameConfig.gameHost, port: gameConfig.gamePort}).then(function () {
            return net.asynUserLogin(phoneNumber, password).then(function (data) {
                return net.asynReady({host: data.server.host, port: data.server.port}).thenResolve(data)
            }).then(function (data) {
                return net.asynEnter(data.uid, data.token)
            }).catch(function (reason) {
                return Q.reject('所在 Action：connect， Action error reason: ' + JSON.stringify(reason))
            })
        })
    }

    this.robotIdentitiyEnsure = (phoneNumber, password) => {
        return findUser(phoneNumber).then(function (data) {
            if (!data) {
                logger.info('创建新的机器人 => %s', phoneNumber)
                return createUser(phoneNumber, password)
            }
            else {
                return Q.resolve(data)
            }
        })
    }

    function findUser (phoneNumber) {
        return dbAction.asynFindUserInAllTable(phoneNumber)
    }

    function createUser (phoneNumber, password) {
        return net.asynReady({host: gameConfig.gameHost, port: gameConfig.gamePort}).then(function () {
            return net.asynLogin()
        }).then(function (data) {
            return dbAction.asynUpdateUser(data.uid, phoneNumber, password)
        }).then(function () {
            return dbAction.asynFindUserInAllTable(phoneNumber)
        })
    }

}

module.exports = RobotAction
