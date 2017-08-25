/**
 * Created by HJ on 2017/8/24.
 */

// require('./pomelo-client')

require('../pomelo-cocos2d-js')
const P1 = new PP()
const P2 = new PP()
const pomelo1 = P1.pomelo
const pomelo2 = P2.pomelo
//
function ready(pomelo, cb) {

    pomelo.init({
        host: '192.168.1.218',
        port: 8100
    }, function (socket) {
        cb()
    })

}
ready(pomelo1, function () {})

setTimeout(function () {
    ready(pomelo2, function () {

        // pomelo1.disconnect()
        // pomelo2.disconnect()
        // pomelo2.disconnect()

        // pomelo2.request('gate.loginHandler.visitorLogin', {visitorID: ''}, function (data) {
        //     console.log(data)
        // })
        //
        // console.log(12312313)

    })

}, 1000)






var connect = function (url, cb) {

    console.log('connect to ' + url);

    var onopen = function (event) {

        console.log('connect success')

    };
    var onmessage = function (event) {
    };
    var onerror = function (event) {
        console.error('socket error: ', event);
    };
    var onclose = function (event) {
        console.error('socket close: ', event);
    };
    const WebSocket = require('ws')
    const socket = new WebSocket(url);
    socket.binaryType = 'arraybuffer';
    socket.onopen = onopen;
    socket.onmessage = onmessage;
    socket.onerror = onerror;
    socket.onclose = onclose;

    return socket

};

// const socket1 = connect('ws://192.168.1.218:8100')
// const socekt2 = connect('ws://192.168.1.218:8100')
//
// console.log(socket1 === socekt2)
//
// setTimeout(function () {
//     socket1.close()
// }, 2000)
//
// setTimeout(function () {
//     socket2.close()
// }, 4000)


