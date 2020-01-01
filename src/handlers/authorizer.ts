import config from '../config.json';

export const handler = (event, _context, callback) => {
  const authorizationHeader = event.headers.authorization;

  if (!authorizationHeader) return callback('Unauthorized');

  const [encodedCreds] = authorizationHeader.split(' ');
  const plainCreds = new Buffer(encodedCreds, 'base64').toString().split(':');
  const [username, password] = plainCreds;

  if (!(username === config.username && password === config.password))
    return callback('Unauthorized');

  const authResponse = buildAllowAllPolicy(event, username);

  callback(null, authResponse);
};

function buildAllowAllPolicy(event, principalId) {
  const tmp = event.methodArn.split(':');
  const apiGatewayArnTmp = tmp[5].split('/');
  const awsAccountId = tmp[4];
  const awsRegion = tmp[3];
  const restApiId = apiGatewayArnTmp[0];
  const stage = apiGatewayArnTmp[1];
  const apiArn = `arn:aws:execute-api:${awsRegion}:${awsAccountId}:${restApiId}/${stage}/*/*`;

  const policy = {
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
