
const Q = require('q')

function a() {

    setTimeout(function () {
        throw 123
    }, 1000)

}

function b() {

    return Q.async(function* () {

        throw 123
        console.log(333333333333)

    })()

}

function main() {
    try {

        Q.spawn(function* () {
            try {
                yield b()
            }
            catch (err) {
                console.log('111' + err)
            }
        })

    }
    catch (err) {
        console.log(1 + err)
    }
    
    // b().then(function (success) {
    //
    // }, function (err) {
    //     console.log(err)
    // })
    
}

main()