import _ from 'lodash';
import * as s3 from './s3';
import { config } from '../config';

const defaultFilePath = 'import-map.json';

function getFilePath(env) {
  if (_.has(config, ['locations', env])) {
    return config.locations[env];
  } else if (_.has(config, ['locations', 'default'])) {
    return config.locations.default;
  } else {
    return defaultFilePath;
  }
}

export const readManifest = env => s3.readManifest(getFilePath(env));
export const writeManifest = (data, env) =>
  s3.writeManifest(getFilePath(env), data);
