//
//
// const EventEmitter = require('events')
// const inherits = require('util').inherits
//
// function LLLL() {
//
//     EventEmitter.call(this)
//
// }
// inherits(LLLL, EventEmitter)
//
// const ll = new LLLL()
// ll.on('a', function () {
//     console.log(123)
// })
//
// ll.emit('a')

const a = {"a": 1}
delete a['a']
console.log(a)