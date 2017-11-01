/**
 * Created by HJ on 2017/8/24.
 */

const Q = require('q')
Q.nbind()

let generator = null

function promiseThing() {

    setTimeout(function () {
        console.log('promise thing done!!!')
        generator.next('success!')
    }, 1500)

}

function* target() {

    console.log('do something sync')
    const result = yield promiseThing()
    console.log('do otherthing sync after result get : ', result)
    return result

}

function* ceshi() {

    let i = 0
    while (true) {
        const r = yield i++
        console.log(r)
    }

}

function myGenerator() {


    let i = 0
    while (true) {
        i++
    }

    function next() {
        return i
    }

}

generator = target()
console.log(generator.next())


// const iterator = ceshi()
// console.log(iterator.next('a'))
// console.log(iterator.next(2))
// console.log(iterator.next(3))