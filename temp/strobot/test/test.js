/**
 * Created by HJ on 2017/8/24.
 */

const Q = require('q')
const timeInterval = 500
const successRate = 0.8

function connetServer_(cb) {

    setTimeout(function () {
        const success = Math.random() < successRate
        if (success) {
            cb(null)
        }
        else {
            cb('连接服务器发生错误')
        }
    }, timeInterval)

}

function bet_(cb) {

    setTimeout(function () {
        const success = Math.random() < successRate
        if (success) {
            cb(null)
        }
        else {
            cb('下注错误')
        }
    }, timeInterval)

}

function play_(cb) {

    setTimeout(function () {
        const success = Math.random() < successRate
        if (success) {
            const win = Math.random() < 0.2
            cb(null, win)
        }
        else {
            cb('玩耍错误')
        }
    }, timeInterval)

}

function checkout_(cb) {

    setTimeout(function () {
        const success = Math.random() < successRate
        if (success) {
            cb(null)
        }
        else {
            cb('结算错误')
        }
    }, timeInterval)

}

const connetServer = Q.nbind(connetServer_)
const bet = Q.nbind(bet_)
const play = Q.nbind(play_)
const checkout = Q.nbind(checkout_)

const connectAction = Q.async(function* () {
    yield connetServer()
})

const playAction = Q.async(function* () {

    let winTime = 0
    while (winTime < 5) {

        console.log(winTime)
        try {
            yield bet()
            const result = yield play()
            if (result) winTime++
        }
        catch (err) {
            console.log(err)
        }

    }

})

const  checkoutAction =  Q.async(function* () {
    yield checkout()
})

Q.spawn(function* () {

    yield connectAction()
    yield playAction()
    yield checkoutAction()

})