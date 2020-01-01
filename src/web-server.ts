import express, { Request, Response } from 'express';
import bodyParser from 'body-parser';
import cors from 'cors';
import request, {
  UrlOptions,
  CoreOptions,
  Response as ReqResponse,
} from 'request';
import morgan from 'morgan';
import util from 'util';
import _ from 'lodash';

import { readManifest } from './io-methods/default';
import { modifyMultipleServices, modifyService } from './modify';
import { getEnvNames, getEnvLocation } from './environment-helpers';

export const app = express();
const requestAsPromise = util.promisify(request);

app.set('etag', false);
app.use(bodyParser.text({ type: '*/*' }));
app.use(
  morgan((tokens, req, res) => {
    return [
      tokens.method(req, res),
      tokens.url(req, res),
      tokens.status(req, res),
      JSON.stringify(req.body),
    ].join(' ');
  })
);

app.use(cors());
app.use(express.static(__dirname + '/public'));

function getEnv(req: Request) {
  if (req.query.env === undefined) {
    return 'default';
  } else {
    return req.query.env;
  }
}

app.get('/environments', function(_req, res) {
  res.send({
    environments: notEmpty(getEnvNames()).map(toEnvObject),
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
    return (
      name === 'default' || getEnvLocation(name) === getEnvLocation('default')
    );
  }

  function aliases(envName) {
    return getEnvNames().filter(name => {
      return (
        envName !== name && getEnvLocation(name) === getEnvLocation(envName)
      );
    });
  }
});

app.get('/import-map.json', handleGetManifest);

function handleGetManifest(req: Request, res: Response) {
  let env = getEnv(req);

  readManifest(env)
    .then(data => {
      var json = JSON.parse(data as string);
      res.send(json);
    })
    .catch(ex => {
      console.error(ex);
      res.status(500).send(`Could not read manifest file -- ${ex.toString()}`);
    });
}

app.patch('/import-map.json', (req: Request, res: Response) => {
  const env = getEnv(req);

  try {
    req.body = JSON.parse(req.body);
  } catch (err) {
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
      .send(
        "Invalid import map in request body -- 'imports' object required with modules in it."
      );
    return;
  }

  for (let moduleName in req.body.imports) {
    if (typeof req.body.imports[moduleName] !== 'string') {
      res
        .status(400)
        .send(
          `Invalid import map in request body -- module with name '${moduleName}' does not have a string url`
        );
      return;
    }
  }

  const importUrls = Object.values(req.body.imports);
  const validImportUrlPromises = importUrls.map(url =>
    requestAsPromise({ url, strictSSL: false } as UrlOptions & CoreOptions)
      .then((resp: ReqResponse) => {
        if (resp.statusCode !== 200) {
          throw Error(
            `The following url in the request body is not reachable: ${url}`
          );
        }
      })
      .catch(err => {
        console.error(err);
        throw Error(
          `The following url in the request body is not reachable: ${url}`
        );
      })
  );

  Promise.all(validImportUrlPromises)
    .then(() => {
      modifyMultipleServices(env, req.body.imports)
        .then(newImportMap => {
          res.status(200).send(newImportMap);
        })
        .catch(err => {
          console.error(err);
          res.status(500).send(`Could not update import map`);
        });
    })
    .catch(err => {
      res.status(400).send(err.message);
    });
});

app.get('/', (_req, res) => {
  res.send('everything ok');
});

app.patch('/services', (req, res) => {
  req.body = JSON.parse(req.body);

  let service;
  let url;
  let env = getEnv(req);

  if (req.body != undefined && req.body.hasOwnProperty('service')) {
    service = req.body.service;
  } else {
    return res.status(400).send('service key is missing');
  }
  if (req.body != undefined && req.body.hasOwnProperty('url')) {
    url = req.body.url;
  } else {
    return res.status(400).send('url key is missing');
  }

  request({ url: url, strictSSL: false }, (error, response) => {
    if (!error && response.statusCode == 200) {
      modifyService(env, service, url)
        .then(json => {
          res.send(json);
        })
        .catch(ex => {
          console.error(ex);
          res
            .status(500)
            .send(`Could not write manifest file -- ${ex.toString()}`);
        });
    } else {
      res
        .status(400)
        .send(`The url does not exist for service ${service}: ${url}`);
    }
  });
});

app.delete('/services/:serviceName', (req, res) => {
  let env = getEnv(req);
  modifyService(env, req.params.serviceName, null, true)
    .then(data => {
      res.send(data);
    })
    .catch(ex => {
      console.error(ex);
      res
        .status(500)
        .send(`Could not delete service ${req.params.serviceName}`);
    });
});
