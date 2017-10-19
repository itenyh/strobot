/**
 * Created by HJ on 2017/8/24.
 */

global.logger = require('../../util/logger')
const robotManager = require('./robots-manager')

const pipe = require('./file-writer-manager')
pipe.start()

robotManager.init(function () {
    pipe.stop()
})


