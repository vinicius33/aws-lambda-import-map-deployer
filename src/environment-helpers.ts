import _ from 'lodash';
import { getConfig } from './config';

export const getEnvNames = () => {
  return getConfig() && getConfig().locations
    ? Object.keys(getConfig().locations)
    : [];
};

export const getEnvLocation = envName => {
  return getConfig().locations[envName];
};
