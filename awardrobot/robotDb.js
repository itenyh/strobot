
if (!String.prototype.format) {
    String.prototype.format = function () {
        var args = arguments;
        return this.replace(/{(\d+)}/g, function (match, number) {
            return typeof args[number] != 'undefined'
                ? args[number]
                : match
                ;
        });
    };
}


const Q = require('q')

const dbServer = '192.168.1.218'
const dbPort = '27017'
const userName = 'egg'
const password = 123
const database = 'eggDatabase'
const mongoUrl = 'mongodb://{0}:{1}@{2}:{3}/{4}'.format(userName, password, dbServer, dbPort, database)

const mongoClient = require('mongodb' ).MongoClient

function findUser(phoneNumber, tableName, cb) {

    mongoClient.connect(mongoUrl, function (err, db) {
        if (!err) {
            const cursor = db.collection(tableName).find({'phoneNumber': phoneNumber})

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
                db.close()
            })

        }
        else {
            cb('数据库连接错误')
        }
    })


}

const asynFindUser = Q.nbind(findUser)

function findUserInAllTable(phoneNumber, cb) {

    let userTableIndex = 1
    function doRecusive(phoneNumber, userTableIndex) {

        const tableName = 'user_info{0}'.format(userTableIndex)
        return asynFindUser(phoneNumber, tableName).then(function (data){
            if (data) {
                cb(null, data)
            }
            else {
                if (userTableIndex <= 5) {
                    userTableIndex++
                    return doRecusive(phoneNumber, userTableIndex, cb)
                }
                else {
                    cb(null)
                }
            }
        })

    }

    doRecusive(phoneNumber, userTableIndex)

}

function updateUser(uid, phoneNumber, password, cb) {

    const userTableIndex = uid[uid.length - 1]
    const tableName = 'user_info{0}'.format(userTableIndex)
    mongoClient.connect(mongoUrl, function (err, db) {
        if (!err) {
            db.collection(tableName).updateOne({'uid': uid},
                {
                    $set:
                        {
                            'phoneNumber': phoneNumber,
                            'password': password
                        }
                }, function (err, result) {
                    if (err) {
                        cb(err)
                    }
                    else {
                        cb(null)
                    }
                    db.close()
            })
        }
        else {
            cb('数据库连接错误')
        }
    })

}


exports.asynFindUserInAllTable = Q.nbind(findUserInAllTable)
exports.asynUpdateUser = Q.nbind(updateUser)

