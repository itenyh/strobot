

function RobotsInfo() {

    const infos = {}

    this.register = function (room, robot) {

        if (!infos.hasOwnProperty(room)) {
            infos[room] = []
        }
        infos[room].push(robot)

    }

    this.removeRobot = function (room, robot) {

        if (!infos.hasOwnProperty(room)) {
            return false
        }

        let index = -1
        let finded = false
        for (robotInRoom of infos[room]) {
            index++
            if (robotInRoom === robot) {
                finded = true
                break
            }
        }

        if (finded) {
            infos[room].splice(index, 1)
        }

        this.printAllRobot()

    }

    this.getRobotNumInRoom = function (roomCode) {
        if (!infos.hasOwnProperty(roomCode)) { return 0 }
        else return infos[roomCode].length
    }

    this.getPoorestInRoom = function (roomCode) {

        if (!infos.hasOwnProperty(roomCode)) { return null }
        const robots = infos[roomCode]
        if (robots.length == 0) { return null }
        
        robots.sort(function (a, b) {
            const goldA = a.action.getRobotInfo().gold
            const goldB = b.action.getRobotInfo().gold
            return goldA - goldB
        })

        return robots[0]

    }

    this.printAllRobot = function () {
        Object.keys(infos).forEach(function(roomCode){

            const robots = infos[roomCode]
            for (r of robots) {
                console.log(roomCode, {'gold': r.action.getRobotInfo().gold, 'uid': r.action.getRobotInfo().uid})
            }

        });

    }

    this.stopAllRobots = function () {
        Object.keys(infos).forEach(function(roomCode){

            const robots = infos[roomCode]
            for (r of robots) {
                r.stop()
            }

        });
    }
    
}

module.exports = new RobotsInfo()