"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
var express_1 = __importDefault(require("express"));
var body_parser_1 = __importDefault(require("body-parser"));
var cors_1 = __importDefault(require("cors"));
var request_1 = __importDefault(require("request"));
var morgan_1 = __importDefault(require("morgan"));
var util_1 = __importDefault(require("util"));
var default_1 = require("./io-methods/default");
var modify_1 = require("./modify");
var environment_helpers_1 = require("./environment-helpers");
exports.app = express_1.default();
var requestAsPromise = util_1.default.promisify(request_1.default);
exports.app.set('etag', false);
exports.app.use(body_parser_1.default.text({ type: '*/*' }));
exports.app.use(morgan_1.default(function (tokens, req, res) {
    return [
        tokens.method(req, res),
        tokens.url(req, res),
        tokens.status(req, res),
        JSON.stringify(req.body),
    ].join(' ');
}));
exports.app.use(cors_1.default());
exports.app.use(express_1.default.static(__dirname + '/public'));
function getEnv(req) {
    if (req.query.env === undefined) {
        return 'default';
    }
    else {
        return req.query.env;
    }
}
exports.app.get('/environments', function (_req, res) {
    res.send({
        environments: notEmpty(environment_helpers_1.getEnvNames()).map(toEnvObject),
    });
    function notEmpty(envs) {
        return envs.length > 0 ? envs : ['default'];
    }
    function toEnvObject(name) {
        return {
            name: name,
            isDefault: isDefault(name),
            aliases: aliases(name),
        };
    }
    function isDefault(name) {
        return (name === 'default' || environment_helpers_1.getEnvLocation(name) === environment_helpers_1.getEnvLocation('default'));
    }
    function aliases(envName) {
        return environment_helpers_1.getEnvNames().filter(function (name) {
            return (envName !== name && environment_helpers_1.getEnvLocation(name) === environment_helpers_1.getEnvLocation(envName));
        });
    }
});
exports.app.get('/import-map.json', handleGetManifest);
function handleGetManifest(req, res) {
    var env = getEnv(req);
    default_1.readManifest(env)
        .then(function (data) {
        var json = JSON.parse(data);
        res.send(json);
    })
        .catch(function (ex) {
        console.error(ex);
        res.status(500).send("Could not read manifest file -- " + ex.toString());
    });
}
exports.app.patch('/import-map.json', function (req, res) {
    var env = getEnv(req);
    try {
        req.body = JSON.parse(req.body);
    }
    catch (err) {
        console.error(err);
        res
            .status(400)
            .send('Patching the import map requires a json request body');
        return;
    }
    if (req.body.scopes) {
        res
            .status(400)
            .send('import-map-deployer does not support import map scopes');
        return;
    }
    if (!req.body.imports || Object.keys(req.body.imports).length === 0) {
        res
            .status(400)
            .send("Invalid import map in request body -- 'imports' object required with modules in it.");
        return;
    }
    for (var moduleName in req.body.imports) {
        if (typeof req.body.imports[moduleName] !== 'string') {
            res
                .status(400)
                .send("Invalid import map in request body -- module with name '" + moduleName + "' does not have a string url");
            return;
        }
    }
    var importUrls = Object.values(req.body.imports);
    var validImportUrlPromises = importUrls.map(function (url) {
        return requestAsPromise({ url: url, strictSSL: false })
            .then(function (resp) {
            if (resp.statusCode !== 200) {
                throw Error("The following url in the request body is not reachable: " + url);
            }
        })
            .catch(function (err) {
            console.error(err);
            throw Error("The following url in the request body is not reachable: " + url);
        });
    });
    Promise.all(validImportUrlPromises)
        .then(function () {
        modify_1.modifyMultipleServices(env, req.body.imports)
            .then(function (newImportMap) {
            res.status(200).send(newImportMap);
        })
            .catch(function (err) {
            console.error(err);
            res.status(500).send("Could not update import map");
        });
    })
        .catch(function (err) {
        res.status(400).send(err.message);
    });
});
exports.app.get('/', function (_req, res) {
    res.send('everything ok');
});
exports.app.patch('/services', function (req, res) {
    req.body = JSON.parse(req.body);
    var service;
    var url;
    var env = getEnv(req);
    if (req.body != undefined && req.body.hasOwnProperty('service')) {
        service = req.body.service;
    }
    else {
        return res.status(400).send('service key is missing');
    }
    if (req.body != undefined && req.body.hasOwnProperty('url')) {
        url = req.body.url;
    }
    else {
        return res.status(400).send('url key is missing');
    }
    request_1.default({ url: url, strictSSL: false }, function (error, response) {
        if (!error && response.statusCode == 200) {
            modify_1.modifyService(env, service, url)
                .then(function (json) {
                res.send(json);
            })
                .catch(function (ex) {
                console.error(ex);
                res
                    .status(500)
                    .send("Could not write manifest file -- " + ex.toString());
            });
        }
        else {
            res
                .status(400)
                .send("The url does not exist for service " + service + ": " + url);
        }
    });
});
exports.app.delete('/services/:serviceName', function (req, res) {
    var env = getEnv(req);
    modify_1.modifyService(env, req.params.serviceName, null, true)
        .then(function (data) {
        res.send(data);
    })
        .catch(function (ex) {
        console.error(ex);
        res
            .status(500)
            .send("Could not delete service " + req.params.serviceName);
    });
});
//# sourceMappingURL=web-server.js.map