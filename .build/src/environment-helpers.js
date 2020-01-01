"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var config_1 = require("./config");
exports.getEnvNames = function () {
    return config_1.getConfig() && config_1.getConfig().locations
        ? Object.keys(config_1.getConfig().locations)
        : [];
};
exports.getEnvLocation = function (envName) {
    return config_1.getConfig().locations[envName];
};
//# sourceMappingURL=environment-helpers.js.map