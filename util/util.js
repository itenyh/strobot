/**
 * Created by HJ on 2017/8/24.
 */

const CSV = require('comma-separated-values')
const fs = require('fs');

exports.writeHis2File = (history, filename = './data/message.csv') => {

    const result = new CSV(history, { header: false }).encode();
    // const ws = fs.createWriteStream(filename);
    // ws.write(result);
    // ws.end();
    fs.appendFileSync(filename, result + '\n');

}

exports.writeLine = (line, filename = './data/message.csv') => {

    const result = new CSV([line], { header: false }).encode();
    fs.appendFileSync(filename, result + '\n');

}

(function () {
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
})()
