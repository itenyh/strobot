

function RobotsInfo() {

    const infos = {}
    const refRobots = {}

    this.register = function (room, uid) {

        if (!infos.hasOwnProperty(room)) {
            infos[room] = []
        }
        infos[room].push(uid)

    }

    this.registerRef = function (uid, robot) {
        refRobots[uid] = robot
    }

    this.removeRobot = function (room, uid) {

        if (!infos.hasOwnProperty(room)) {
            return false
        }

        let index = -1
        let finded = false
        for (robotInRoom of infos[room]) {
            index++
            if (robotInRoom === uid) {
                finded = true
                break
            }
        }

        if (finded) {
            infos[room].splice(index, 1)
            delete refRobots[uid]
        }

        // this.printAllRobot()

    }

    this.getRobotNumInRoom = function (roomCode) {
        if (!infos.hasOwnProperty(roomCode)) { return 0 }
        else return infos[roomCode].length
    }

    this.getPoorestInRoom = function (roomCode) {

        const robots = getRobotRefsByRoomCode(roomCode)

        robots.sort(function (a, b) {
            const goldA = a.action.getRobotInfo().gold
            const goldB = b.action.getRobotInfo().gold
            return goldA - goldB
        })

        return robots[0]

    }

    this.printAllRobot = function () {
        Object.keys(infos).forEach(function(roomCode){

            const robots = getRobotRefsByRoomCode(roomCode)
            for (r of robots) {
                console.log(roomCode, {'gold': r.action.getRobotInfo().gold, 'uid': r.action.getRobotInfo().uid})
            }

        });
    }

    this.stopAllRobots = function () {
        Object.keys(infos).forEach(function(roomCode){

            const robots = getRobotRefsByRoomCode(roomCode)
            for (r of robots) {
                r.stop()
            }

        });
    }
    
    this.getRobotByNid = function (nid) {

        if (nid === '1') {
            return require('../a777robot/robot')
        }
        else if (nid === '2') {
            return require('../hambougerrobot/robot')
        }
        else if (nid === '7') {
            return require('../hotpotrobot/robot')
        }

        return null

    }

    const getRobotRefsByRoomCode = function(roomCode) {

        if (!infos.hasOwnProperty(roomCode)) { return [] }
        const uids = infos[roomCode]
        if (uids.length == 0) { return [] }

        const robots = []
        for (uid of uids) {
            robots.push(refRobots[uid])
        }

        return robots
    }
    
}

module.exports = new RobotsInfo()