
var Promise     = require('bluebird');
var request     = require('request');
var exceltojson = require('xls-to-json-lc');
var banks       = require('./bankmappings.json');
var bankInfo    = require('./bankXls.json');
var fs          = require('fs');
var https       = require('https');
var cache       = {};
// function makeBankXlsMappings{};
// function init(){};
exports.isValid = isValidIFSC;
function getInfoByCode(code, callback){
    if(cache[code]){
        return callback(null,cache[code]);
    }
    processCodeInternal(code, callback);

}
function isValidIFSC(code){
    if(!code){
        return false;
    }
    var ifscRegex = /^[A-Za-z]{4}\d{7}$/;

    if(!ifscRegex.test(code)){
        return false;
    }
    var bankCode = code.slice(0,4);
    if(!banks[bankCode]){
        return false;
    }
    getInfoByCode(code, function(error, result){
        if(error || !result){
            return false;
        }
        return true;
    });
}


function processCodeInternal(code, callback){

    getXls(code, function(error) {
        if (error) {
            return callback(error);
        }
        exceltojson({
            input: "./temp.xls",
            lowerCaseHeaders: true
        }, function (err, result) {
            if (err) {
                callback(err);
            } else {
                result = result.map(function (element) {

                    return {
                        address: element.address + ', ' + element.state,
                        ifsc: element.ifsc
                    };
                });
                cache[code] = result;
                return callback(null, result);
            }
        });
    });
}
function getXls(code, callback){
    var file = fs.createWriteStream('temp.xls');
    var options = {
        url: bankInfo[code.slice(0,4)],
        method: 'GET'
    };

    https.get(options.url, function(res) {
        res.on('data', function(data) {
            file.write(data);
        }).on('finish', function() {
            file.end();
            return callback(null);
        })
    });
}