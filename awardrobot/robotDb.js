
const Q = require('q')
require('../util/util')
const gameConfig = require('./config/game-config.json')

const mongoUrl = gameConfig.database2
const mongoClient = require('mongodb' ).MongoClient

const asynConnect = Q.nbind(function (cb) {
    mongoClient.connect(mongoUrl, function (err, db) {
        if (!err) {
            cb(null, db)
        }
        else {
            cb(err)
        }
    })
})

const asynFindOneCursor = Q.nbind(function (cursor, cb) {
    let result = null
    cursor.forEach(function (doc) {
        result = doc
    }, function (mongoError) {
        if (mongoError) {
            cb(mongoError)
        }
        else {
            cb(null, result)
        }
    })
})

const asynFindAllCursor = Q.nbind(function (cursor, cb) {
    let result = []
    cursor.forEach(function (doc) {
        result.push(doc)
    }, function (mongoError) {
        if (mongoError) {
            cb(mongoError)
        }
        else {
            cb(null, result)
        }
    })
})

const asynUpdate = Q.nbind(function (db, tableName, conditions, updateInfo, cb) {

    db.collection(tableName).updateOne(conditions,
        {
            $set: updateInfo
        }, function (err, result) {
            if (err) {
                cb(err)
            }
            else {
                cb(null)
            }
        })

})

function findUser(phoneNumber, tableName) {

    return Q.async(function* () {

        const db = yield asynConnect()
        const cursor = db.collection(tableName).find({'phoneNumber': phoneNumber})
        const result = yield asynFindOneCursor(cursor)
        db.close()
        return result

    })()

}

exports.asynFindUserInAllTable = Q.async(function* (phoneNumber) {

    let userTableIndex = 1

    while (userTableIndex <= 5) {
        const tableName = 'user_info{0}'.format(userTableIndex++)
        const data = yield findUser(phoneNumber, tableName)
        if (data) {
            return data
        }
    }

    return null
    {}
})

exports.asynUpdateUser = Q.async(function* (uid, phoneNumber, password) {
    const userTableIndex = uid[uid.length - 1]
    const tableName = 'user_info{0}'.format(userTableIndex)
    const db = yield asynConnect()
    yield asynUpdate(db, tableName, {'uid': uid}, {
        'phoneNumber': phoneNumber,
        'password': password
    })
    db.close()
})

exports.findAllGiveBeansEggFriend = a = Q.async(function* () {

    let tableIndex = 1
    let finalResult = []
    while (tableIndex <= 5) {
        const tableName = 'player_info{0}'.format(tableIndex++)
        const condition = {beans: {$lt: 100}, buyShellTimes: 0, unReceivedBeans: 0, dailyReceivedBeans: {$lte: 200}, loginStatus: 1}
        const testCondition = {beans: {$lt: 510}}
        const result = yield asynFindAll(tableName, testCondition)
        // const uidResult = result.map(function (user) {
        //     console.log(user)
        //     return user.uid
        // })
        finalResult = finalResult.concat(result)
    }
    return finalResult

})

function asynFindAll(tableName, conditions) {

    return Q.async(function* () {

        const db = yield asynConnect()
        const cursor = db.collection(tableName).find(conditions)
        const result = yield asynFindAllCursor(cursor)
        db.close()
        // console.log(result.length)
        return result

    })()

}

a()