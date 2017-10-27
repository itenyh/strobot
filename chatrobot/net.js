/**
 * Created by HJ on 2017/8/23.
 */

const Q = require('q')

function RobotNet(pomelo_) {

    const pomelo = pomelo_

    function ready(param, cb) {

        pomelo.disconnect()
        pomelo.init({
            host: param.host,
            port: param.port
        }, function (socket) {
            cb(null)
        })

    }

    function queryEntry(username, cb) {

        pomelo.request('gate.gateHandler.queryEntry', {
            uid: username
        }, function (data) {
            responseHandler(data, queryEntry, cb)
        })

    }

    function enter(room, username, cb) {
        pomelo.request('connector.entryHandler.enter', {
            username: username,
            rid: room
        }, function (data) {
            responseHandler(data, enter, cb)
        })
    }

    function chat(from, target, content, room, cb) {
        pomelo.request('chat.chatHandler.send', {
            rid: room,
            content: content,
            from: from,
            target: target
        }, function (data) {
            responseHandler(data, chat, cb)
        })
    }

    function play(cb) {
        pomelo.request('connector.entryHandler.play', function (data) {
            responseHandler(data, play, cb)
        })
    }


    function responseHandler(data, func, cb) {

        // console.log(data, func)

        if (data.code === 200) {
            // logger.info('%s 调用成功', func.name)
            cb(null, data)
        }
        else {
            // logger.error('网络调用失败: ' + func.name + ', ' +  JSON.stringify(data))
            cb('网络接口错误: ' + func.name + ', ' +  JSON.stringify(data))
            // cb(null, data)
        }

    }


    this.asynReady = Q.nbind(ready)
    this.asynEnter = Q.nbind(enter)
    this.asynQueryEntry = Q.nbind(queryEntry)
    this.asynChat = Q.nbind(chat)
    this.asynPlay = Q.nbind(play)

    this.disconnect = pomelo.disconnect

}

module.exports = RobotNet