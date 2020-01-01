"use strict";
var ioOperations = require("./io-operations.js");
exports.runCheck = function () {
    return ioOperations.readManifest().then(function (firstManifest) {
        return ioOperations.writeManifest(firstManifest).then(function () {
            return ioOperations.readManifest().then(function (secondManifest) {
                if (firstManifest !== secondManifest) {
                    throw new Error("Health check failed - reading then writing the same then reading should be idempotent");
                }
                else {
                    console.log("Health check complete");
                }
            });
        });
    });
};
//# sourceMappingURL=health-check.js.map