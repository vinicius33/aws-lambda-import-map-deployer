"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
var config_json_1 = __importDefault(require("../config.json"));
exports.handler = function (event, _context, callback) {
    var authorizationHeader = event.headers.authorization;
    if (!authorizationHeader)
        return callback('Unauthorized');
    var encodedCreds = authorizationHeader.split(' ')[0];
    var plainCreds = new Buffer(encodedCreds, 'base64').toString().split(':');
    var username = plainCreds[0], password = plainCreds[1];
    if (!(username === config_json_1.default.username && password === config_json_1.default.password))
        return callback('Unauthorized');
    var authResponse = buildAllowAllPolicy(event, username);
    callback(null, authResponse);
};
function buildAllowAllPolicy(event, principalId) {
    var tmp = event.methodArn.split(':');
    var apiGatewayArnTmp = tmp[5].split('/');
    var awsAccountId = tmp[4];
    var awsRegion = tmp[3];
    var restApiId = apiGatewayArnTmp[0];
    var stage = apiGatewayArnTmp[1];
    var apiArn = "arn:aws:execute-api:" + awsRegion + ":" + awsAccountId + ":" + restApiId + "/" + stage + "/*/*";
    var policy = {
        principalId: principalId,
        policyDocument: {
            Version: '2012-10-17',
            Statement: [
                {
                    Action: 'execute-api:Invoke',
                    Effect: 'Allow',
                    Resource: [apiArn],
                },
            ],
        },
    };
    return policy;
}
//# sourceMappingURL=authorizer.js.map