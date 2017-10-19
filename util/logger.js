/**
 * Created by HJ on 2017/8/25.
 */

// { error: 0, warn: 1, info: 2, verbose: 3, debug: 4, silly: 5 } 大于等于会被记录

const winston = require('winston')
const logger = new (winston.Logger)({

    transports: [
        new (winston.transports.File)({
            name: 'info-file',
            filename: './log/filelog-info.log',
            level: 'info'
        }),
        new (winston.transports.File)({
            name: 'error-file',
            filename: './log/filelog-error.log',
            level: 'error'
        }),
        new (winston.transports.Console)({
            level: 'info'
        })
    ]

});

function Logger() {

    this.info = logger.info
    this.error = logger.error

    this.robotInfo = (robotDes, message) => {

        this.info('机器人【%s】号 => %s', robotDes, message)

    }

}

module.exports = new Logger()
