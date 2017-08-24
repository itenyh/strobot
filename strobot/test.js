/**
 * Created by HJ on 2017/8/24.
 */

var myObj = {

    specialFunction: function () {

    },

    anotherSpecialFunction: function () {

    },

    getAsyncData: function (cb) {
        cb();
    },

    render: function () {
        // var that = this;
        this.getAsyncData(function () {
            this.specialFunction();
            this.anotherSpecialFunction();
        });
    }
};

myObj.render();
