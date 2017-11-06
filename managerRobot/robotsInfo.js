

class RobotsInfo {

    constructor() {
        this.infos = {}
        this.refRobots = {}
    }

    register(room, uid) {

        if (!this.infos.hasOwnProperty(room)) {
            this.infos[room] = []
        }
        this.infos[room].push(uid)

    }

    registerRef(uid, robot) {
        this.refRobots[uid] = robot
    }

    removeRobot(room, uid) {

        if (!this.infos.hasOwnProperty(room)) {
            return false
        }

        let index = -1
        let finded = false
        for (robotInRoom of this.infos[room]) {
            index++
            if (robotInRoom === uid) {
                finded = true
                break
            }
        }

        if (finded) {
            this.infos[room].splice(index, 1)
            delete this.refRobots[uid]
        }


    }

    getRobotNumInRoom(roomCode) {
        if (!this.infos.hasOwnProperty(roomCode)) { return 0 }
        else return this.infos[roomCode].length
    }

    getPoorestInRoom(roomCode) {

        const robots = this.getRobotRefsByRoomCode(roomCode)

        robots.sort(function (a, b) {
            const goldA = a.action.getRobotInfo().gold
            const goldB = b.action.getRobotInfo().gold
            return goldA - goldB
        })

        return robots[0]

    }

    printAllRobot() {
        Object.keys(this.infos).forEach(function(roomCode){

            const robots = this.getRobotRefsByRoomCode(roomCode)
            for (r of robots) {
                console.log(roomCode, {'gold': r.action.getRobotInfo().gold, 'uid': r.action.getRobotInfo().uid})
            }

        });
    }

    stopAllRobots() {
        Object.keys(this.infos).forEach(function(roomCode){

            const robots = this.getRobotRefsByRoomCode(roomCode)
            for (r of robots) {
                r.stop()
            }

        });
    }

    getRobotRefsByRoomCode(roomCode) {

        if (!this.infos.hasOwnProperty(roomCode)) { return [] }
        const uids = this.infos[roomCode]
        if (uids.length == 0) { return [] }

        const robots = []
        for (uid of uids) {
            robots.push(this.refRobots[uid])
        }

        return robots
    }
    
}

module.exports = RobotsInfo