"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
var aws_sdk_1 = __importDefault(require("aws-sdk"));
var config_1 = require("../config");
var js_file_helpers_1 = require("./js-file-helpers");
if (config_1.config && config_1.config.region) {
    aws_sdk_1.default.config.update({ region: config_1.config.region });
}
function parseFilePath(filePath) {
    var prefix = 's3://';
    var file = filePath.split(prefix)[1];
    var bucketDelimiter = '/';
    var bucket = file.substr(0, file.indexOf(bucketDelimiter));
    var key = file.substr(file.indexOf('/') + 1);
    return {
        bucket: bucket,
        key: key,
    };
}
var s3 = new aws_sdk_1.default.S3();
exports.readManifest = function (filePath) {
    return new Promise(function (resolve, reject) {
        var file = parseFilePath(filePath);
        s3.getObject({
            Bucket: file.bucket,
            Key: file.key,
        }, function (err, data) {
            if (err) {
                reject(err);
            }
            else {
                resolve(data.Body.toString());
            }
        });
    });
};
exports.writeManifest = function (filePath, data) {
    var jsonPromise = new Promise(function (resolve, reject) {
        var file = parseFilePath(filePath);
        s3.putObject({
            Bucket: file.bucket,
            Key: file.key,
            Body: data,
            ContentType: 'application/json',
            CacheControl: 'public, must-revalidate, max-age=0',
            ACL: 'public-read',
        }, function (err) {
            if (err)
                reject(err);
            else
                resolve();
        });
    });
    var jsPromise = new Promise(function (resolve, reject) {
        var file = parseFilePath(filePath);
        var jsKey = js_file_helpers_1.getJsPath(file.key);
        s3.putObject({
            Bucket: file.bucket,
            Key: jsKey,
            Body: js_file_helpers_1.createJsString(data),
            ContentType: 'application/javascript',
            CacheControl: 'public, must-revalidate, max-age=0',
            ACL: 'public-read',
        }, function (err) {
            if (err)
                reject(err);
            else
                resolve();
        });
    });
    return Promise.all([jsonPromise, jsPromise]);
};
//# sourceMappingURL=s3.js.map