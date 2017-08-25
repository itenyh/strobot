/**
 * Created by HJ on 2017/8/24.
 */

const CSV = require('comma-separated-values')
const fs = require('fs');

exports.writeHis2File = (history, filename = 'message.csv') => {

    const result = new CSV(history, { header: false }).encode();
    // const ws = fs.createWriteStream(filename);
    // ws.write(result);
    // ws.end();
    fs.appendFileSync(filename, result + '\n');

}

// Asynchronously:
//
//     var fs = require('fs');
//
// fs.appendFile('message.txt', 'data to append', function (err) {
//     if (err) throw err;
//     console.log('Saved!');
// });
//
// Synchronously:
//
//     var fs = require('fs');
//
// fs.appendFileSync('message.txt', 'data to append');

