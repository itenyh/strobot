/**
 * Created by HJ on 2017/8/24.
 */

const CSV = require('comma-separated-values')
const fs = require('fs');

exports.writeHis2File = (history, filename = 'message.csv') => {

    const result = new CSV(history, { header: true }).encode();
    const ws = fs.createWriteStream(filename);
    ws.write(result);
    ws.end();

}