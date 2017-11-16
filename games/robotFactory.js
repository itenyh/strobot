
function createRobot(room, action) {

    const Robot = require('./robot')
    const robot = new Robot(room, action)
    return robot

}

exports.createRobot = function(room, nid) {

    const config = require('../robotConfig')
    const action = config.getRobotActionByNid(nid)
    return createRobot(room, action)

}
