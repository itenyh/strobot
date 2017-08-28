const cc = require('../config/user-config.json')

const robotConfigs = []

for (var config of cc) {

    const robotNum = config.robotNum
    for (let i = 0;i < robotNum;i++) {
        robotConfigs.push(config)
    }

}

console.log(robotConfigs)