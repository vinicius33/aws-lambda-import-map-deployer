"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (Object.hasOwnProperty.call(mod, k)) result[k] = mod[k];
    result["default"] = mod;
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
var lodash_1 = __importDefault(require("lodash"));
var s3 = __importStar(require("./s3"));
var config_1 = require("../config");
var defaultFilePath = 'import-map.json';
function getFilePath(env) {
    if (lodash_1.default.has(config_1.config, ['locations', env])) {
        return config_1.config.locations[env];
    }
    else if (lodash_1.default.has(config_1.config, ['locations', 'default'])) {
        return config_1.config.locations.default;
    }
    else {
        return defaultFilePath;
    }
}
exports.readManifest = function (env) { return s3.readManifest(getFilePath(env)); };
exports.writeManifest = function (data, env) {
    return s3.writeManifest(getFilePath(env), data);
};
//# sourceMappingURL=default.js.map