var azure = require("azure-storage");
var blobService;
function getBlobService() {
    blobService = blobService || azure.createBlobService();
    return blobService;
}
exports.readManifest = function (target) {
    var blobService = getBlobService();
    return new Promise(function (resolve, reject) {
        blobService.getBlobToText(target.azureContainer, target.azureBlob, function (error, response) {
            if (error)
                reject(error);
            resolve(response);
        });
    });
};
exports.writeManifest = function (target, content) {
    var blobService = getBlobService();
    return new Promise(function (resolve, reject) {
        blobService.createBlockBlobFromText(target.azureContainer, target.azureBlob, content, function (error, response) {
            if (error)
                reject(error);
            else
                resolve();
        });
    });
};
//# sourceMappingURL=azure.js.map