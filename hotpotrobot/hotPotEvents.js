

const EventEmitter = require('events')
const inherits = require('util').inherits

function HotPotEvents(_pomelo) {

    const pomelo = _pomelo
    let startBetting = false

    EventEmitter.call(this)

    pomelo.on('huoguo.win', function (data) {
        this.emit('win', data)
    }.bind(this))

    pomelo.on('huoguo.roundCd', function (data) {

        if (!startBetting && data.betting) {
            startBetting = true
            this.emit('betting')
        }

        if (!data.betting) {
            startBetting = false
        }

        // console.log('当前时间和状态：', data)
        // console.log(data)

    }.bind(this))

    // pomelo.on('huoguo.dealer', function (data) {
    //     // console.log('当前庄家状态：', data)
    //     // this.action.dealWithDealerChange(data)
    // }.bind(this))

}
inherits(HotPotEvents, EventEmitter)

module.exports = HotPotEvents
