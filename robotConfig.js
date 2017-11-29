'use strict'

const userConfig = require('./temp/user-config.json')
let totalRobot = 0
let runningGmaeName = ''

module.exports.getRobotByNid = function (nid) {

    let PlayerRobot = null
    if (nid === 1) {
        PlayerRobot = require('./games/robot')
    }
    else if (nid === 2) {
        PlayerRobot = require('./games/hambougerrobot/robot')
    }
    else if (nid === 3) {
        PlayerRobot = require('./temp/hotpotrobot/robot')
    }
    else if (nid === 7) {
        PlayerRobot = require('./games/xiyoujirobot/robot')
    }
    else if (nid === 4) {
        PlayerRobot = require('./temp/indianrobot/robot')
    }

    return PlayerRobot

}

module.exports.getRobotActionByNid = function (nid) {

    let Action = null
    const Memory = new require('./games/memory')
    const memory = new Memory()
    const Rules = new require('./games/rules')
    const rules = new Rules()

    if (nid === 1) {
        Action = require('./games/a777robot/robotAction')
    }
    else if (nid === 2) {
        Action = require('./games/hambougerrobot/robotAction')
    }

    // else if (nid === 3) {
    // }
    else if (nid === 7) {
        Action = require('./games/xiyoujirobot/robotAction')
    }
    else if (nid === 10) {
        Action = require('./games/pirate/robotAction')
    }
    // else if (nid === 4) {
    //     Memory = require('./games/indianrobot/memory')
    //     Rules = require('./games/indianrobot/rules')
    //     Action = require('./games/indianrobot/robotAction')
    // }

    else {
        throw '不存在这样的nid: ' + nid
    }

    return new Action(memory, rules, nid)

}

module.exports.getGameNid = function () {

    return userConfig.game_nid

}

module.exports.getRobotNum = function () {

    return userConfig.robotNum

}

module.exports.robotLeave = function () {
    totalRobot -= 1
}

module.exports.robotEnter = function () {
    totalRobot += 1
}

module.exports.print = function () {
    logger.info('共有机器人 %s 在玩耍', totalRobot)
}
