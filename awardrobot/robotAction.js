/**
 * Created by HJ on 2017/8/23.
 */

require('../util/pomelo-cocos2d-js')

const Q = require('q')
const Net = require('./robotNet')
const gameConfig = require('./config/game-config.json')
const dbAction = require('./robotDb')

function RobotAction() {

    const net = new Net((new PP()).pomelo)

    this.disconnect = () => {
        net.disconnect()
    }

    this.connect = Q.async(function* (phoneNumber, password) {
        try {
            yield net.asynReady({host: gameConfig.gameHost, port: gameConfig.gamePort})
            const data = yield net.asynUserLogin(phoneNumber, password)
            yield net.asynReady({host: data.server.host, port: data.server.port})
            yield net.asynEnter(data.uid, data.token)
        }
        catch (err) {
            throw '所在 Action：connect， Action error reason: ' + JSON.stringify(err)
        }
    })

    this.robotIdentitiyEnsure = Q.async(function* (phoneNumber, password) {
        let data = yield dbAction.asynFindUserInAllTable(phoneNumber)
        if (!data) {
            logger.info('创建新的机器人 => %s', phoneNumber)
            data = yield createUser(phoneNumber, password)
        }
        return data
    })

    this.buildRelationWith = Q.async(function* (otherUID, beChild) {
        const data = yield net.asynBuildRelation(otherUID, beChild)
        console.log(data)
    })

    this.scanUsersFindAwardUids = Q.async(function* (memory) {

        const users = yield dbAction.findAllGiveBeansEggFriend()

        //未建立关系的user需要建立关系
        for (user of users) {
            const friends = user.friends
            const allChildren = user.allChildren
            console.log(friends)
        }

        // memory.updateUserAwardBin(uids)
        // const awardUids = memory.createAwardUsers()
        // console.log(awardUids)
        // return awardUids
    })

    function createUser (phoneNumber, password) {
        return Q.async(function* () {

            yield net.asynReady({host: gameConfig.gameHost, port: gameConfig.gamePort})
            const visitUser = yield net.asynLogin()
            yield dbAction.asynUpdateUser(visitUser.uid, phoneNumber, password)
            return yield dbAction.asynFindUserInAllTable(phoneNumber)

        })()
    }


}

module.exports = RobotAction
