

function ManagerRobotMemory() {

    this.index = 1
    const roomInfo = {}

    this.initialRoomInfo = function(data) {
        for (room of data.rooms) {
            const roomCode = room.roomCode
            const num = room.users.length
            roomInfo[roomCode] = {}
            roomInfo[roomCode]['num'] = num
        }
    }

    this.findInitEmptyRoom = function () {

        const emptyRoomCodeList = []

        Object.keys(roomInfo).forEach(function(roomCode){

            if (roomInfo[roomCode]['num'] === 0) {
                emptyRoomCodeList.push(roomCode)
            }

        });

        return emptyRoomCodeList

    }

    this.dealRoomInfoChange = function (data) {

        const roomCode = data['roomCode']
        const users = data['users']
        const num = users.length
        const oldnum = roomInfo.hasOwnProperty(roomCode) ? roomInfo[roomCode]['num'] : 0
        let isIncrement = num > oldnum
        let isRobot = false

        if (num == oldnum) {
            logger.error('num 和 oldnum 相等了 ===> %s', num)
        }

        if (isIncrement) {
            const newUser = users[users.length - 1]
            isRobot = newUser.isRobot
            if (isRobot) {
                global.robotsInfo.register(roomCode, newUser.uid)
            }
        }

        const robotNumInRoom = global.robotsInfo.getRobotNumInRoom(roomCode)

        roomInfo[roomCode] = {}
        roomInfo[roomCode]['num'] = num

        logger.info('isRobot: %s, isIncrement: %s, num: %s, robotNumInRoom: %s ', isRobot, isIncrement, num, robotNumInRoom)

        return [isIncrement && !isRobot && robotNumInRoom > 0, num === 0, roomCode]

    }

}


module.exports = ManagerRobotMemory