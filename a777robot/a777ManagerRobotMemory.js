

function A777ManagerRobotMemory() {

    this.index = 1
    this.roomInfo = {}

    this.initialRoomInfo = function(data) {
        for (room of data.rooms) {
            const roomCode = room.roomCode
            const num = room.users.length
            this.roomInfo[roomCode] = {}
            this.roomInfo[roomCode]['num'] = num
        }
    }

    this.dealRoomInfoChange = function (data) {

        const roomCode = data['roomCode']
        const robotNumInRoom = global.robotsInfo.getRobotNumInRoom(roomCode)
        const users = data['users']
        const num = users.length
        const oldnum = this.roomInfo.hasOwnProperty(roomCode) ? this.roomInfo[roomCode]['num'] : 0
        let isIncrement = num > oldnum
        let isRobot = false

        if (num == oldnum) {
            logger.error('num 和 oldnum 相等了 ===> %s', num)
        }

        if (isIncrement) {
            const newUser = users[users.length - 1]
            isRobot = newUser.isRobot
        }

        this.roomInfo[roomCode] = {}
        this.roomInfo[roomCode]['num'] = num

        logger.info('isRobot: %s, isIncrement: %s, num: %s, robotNumInRoom: %s ', isRobot, isIncrement, num, robotNumInRoom)


        return [isIncrement && !isRobot && robotNumInRoom > 0, num === 0, roomCode]

    }

}


module.exports = A777ManagerRobotMemory