'use strict';
var config = require('./config.js').config;
var getEmptyManifest = require('./modify').getEmptyManifest;
var readManifest, writeManifest, username, password;
if (config) {
    if (typeof config.readManifest === 'function' && typeof config.writeManifest === 'function') {
        readManifest = function (env) {
            var promise = config.readManifest(env);
            if (!(promise instanceof Promise))
                throw new Error("Configuration file provided invalid readManifest function -- expected a Promise to be returned");
            return promise;
        };
        writeManifest = function (string, env) {
            var promise = config.writeManifest(string, env);
            if (!(promise instanceof Promise))
                throw new Error("Configuration file provided invalid writeManifest function -- expected a Promise to be returned");
            return promise;
        };
    }
    else if (config.readManifest || config.writeManifest) {
        throw new Error("Invalid config file -- readManifest and writeManifest should both be functions");
    }
    else {
        useDefaultIOMethod();
    }
}
else {
    useDefaultIOMethod();
}
if (config) {
    if ((typeof config.username === 'string' && typeof config.password === 'string')
        || (config.username === undefined && config.password === undefined)) {
        username = config.username;
        password = config.password;
    }
    else {
        throw new Error("Invalid config file -- username and password should either be strings or missing completely");
    }
}
function useDefaultIOMethod() {
    var defaultIOMethod = require('./io-methods/default.js');
    readManifest = defaultIOMethod.readManifest;
    writeManifest = defaultIOMethod.writeManifest;
}
exports.readManifest = function (env) {
    return new Promise(function (resolve, reject) {
        readManifest(env)
            .then(function (manifest) {
            if (manifest === '') {
                manifest = JSON.stringify(getEmptyManifest());
            }
            resolve(manifest);
        })
            .catch(function (ex) {
            reject(ex);
        });
    });
};
exports.writeManifest = writeManifest;
exports.username = username;
exports.password = password;
//# sourceMappingURL=io-operations.js.map