"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
// File editing
var rwlock_1 = __importDefault(require("rwlock"));
var default_1 = require("./io-methods/default");
var lock = new rwlock_1.default();
function getMapFromManifest(manifest) {
    return manifest.imports;
}
function getEmptyManifest() {
    return { imports: {} };
}
exports.getEmptyManifest = getEmptyManifest;
exports.modifyService = function (env, serviceName, url, remove) {
    return new Promise(function (resolve, reject) {
        // obtain lock (we need a global lock so deploys dont have a race condition)
        lock.writeLock(function (release) {
            // read file as json
            var manifestPromise = default_1.readManifest(env)
                .then(function (data) {
                var json;
                if (data === '') {
                    json = getEmptyManifest();
                }
                else {
                    try {
                        json = JSON.parse(data);
                    }
                    catch (ex) {
                        release();
                        reject('Manifest is not valid json -- ' + ex);
                        return;
                    }
                }
                // modify json
                if (remove) {
                    delete getMapFromManifest(json)[serviceName];
                }
                else {
                    getMapFromManifest(json)[serviceName] = url;
                }
                // write json to file
                var string = JSON.stringify(json, null, 2);
                return default_1.writeManifest(string, env).then(function () {
                    release();
                    return json;
                });
            })
                .catch(function (ex) {
                release();
                throw ex;
            });
            resolve(manifestPromise);
        });
    });
};
exports.modifyMultipleServices = function (env, newImports) {
    return new Promise(function (resolve) {
        lock.writeLock(function (releaseLock) {
            var resultPromise = default_1.readManifest(env)
                .then(function (data) {
                var json = data ? JSON.parse(data) : getEmptyManifest();
                var imports = getMapFromManifest(json);
                Object.assign(imports, newImports);
                var newImportMapString = JSON.stringify(json, null, 2);
                return default_1.writeManifest(newImportMapString, env).then(function () {
                    releaseLock();
                    return json;
                });
            })
                .catch(function (err) {
                releaseLock();
                throw err;
            });
            resolve(resultPromise);
        });
    });
};
//# sourceMappingURL=modify.js.map