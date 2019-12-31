const serverless = require("serverless-http");
const { app } = require("./web-server");

const server = serverless(app);

module.exports.handler = async (event, context) => await server(event, context);
