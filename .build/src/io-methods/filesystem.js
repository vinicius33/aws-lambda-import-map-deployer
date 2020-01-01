"use strict";
var fs = require("fs");
var config = require("../config").config;
var jsHelpers = require("./js-file-helpers.js");
exports.readManifest = function (filePath) {
    return new Promise(function (resolve, reject) {
        //create file if not already created
        fs.open(filePath, "a", function (err, fd) {
            if (err)
                reject("Could not open file " + filePath);
            else {
                fs.readFile(filePath, "utf8", function (err2, data) {
                    if (err2) {
                        console.error(err2);
                        reject("Could not read file " + filePath);
                    }
                    else
                        resolve(data);
                });
            }
        });
    });
};
exports.writeManifest = function (filePath, data) {
    var jsonPromise = new Promise(function (resolve, reject) {
        fs.writeFile(filePath, data, function (err) {
            if (err)
                reject("Could not write file " + filePath);
            else
                resolve();
        });
    });
    var jsPromise = new Promise(function (resolve, reject) {
        if (!config || !config.writeJsFile) {
            resolve();
        }
        else {
            fs.writeFile(jsHelpers.getJsPath(filePath), jsHelpers.createJsString(data), function (err) {
                if (err)
                    reject("Could not write file " + filePath);
                else
                    resolve();
            });
        }
    });
    return Promise.all([jsonPromise, jsPromise]);
};
//# sourceMappingURL=filesystem.js.map