var Storage = require('@google-cloud/storage').Storage;
var storage = new Storage();
var regex = /^google:\/\/(.+)\/(.+)$/;
function parseFilePath(filePath) {
    var _a = regex.exec(filePath), _ = _a[0], bucketName = _a[1], fileName = _a[2];
    if (!bucketName || !fileName) {
        throw Error("Invalid Google Cloud Storage url: " + filePath);
    }
    return { bucketName: bucketName, fileName: fileName };
}
exports.readManifest = function (filePath) {
    return Promise.resolve().then(function () {
        var _a = parseFilePath(filePath), bucketName = _a.bucketName, fileName = _a.fileName;
        return storage
            .bucket(bucketName)
            .file(fileName)
            .download()
            .then(function (data) { return data.toString("utf-8"); });
    });
};
exports.writeManifest = function (filePath, data) {
    return Promise.resolve().then(function () {
        var _a = parseFilePath(filePath), bucketName = _a.bucketName, fileName = _a.fileName;
        return storage
            .bucket(bucketName)
            .file(fileName)
            .save(data);
    });
};
//# sourceMappingURL=google-cloud-storage.js.map