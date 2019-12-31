"use strict";
const config = require("./config.json");

exports.config = config;

exports.setConfig = newConfig => (config = newConfig);
exports.getConfig = () => config;
