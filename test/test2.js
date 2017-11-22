
const Q = require('q')

// let total = 15
// let wolf = 1
// let continuePeople = 2

function c(total, normalPeople, continueNormalPeople) {

    let result = 1
    for (let i = 0;i < continueNormalPeople;i++) {
        result *= ((normalPeople - i) / (total - i))
    }
    return result * (total - normalPeople)

}

console.log(c(18, 5))