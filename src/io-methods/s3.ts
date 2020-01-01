import aws from 'aws-sdk';
import { config } from '../config';
import { getJsPath, createJsString } from './js-file-helpers';

if (config && config.region) {
  aws.config.update({ region: config.region });
}

function parseFilePath(filePath) {
  const prefix = 's3://';
  const file = filePath.split(prefix)[1];
  const bucketDelimiter = '/';
  const bucket = file.substr(0, file.indexOf(bucketDelimiter));
  const key = file.substr(file.indexOf('/') + 1);
  return {
    bucket,
    key,
  };
}

const s3 = new aws.S3();

export const readManifest = filePath => {
  return new Promise(function(resolve, reject) {
    let file = parseFilePath(filePath);
    s3.getObject(
      {
        Bucket: file.bucket,
        Key: file.key,
      },
      function(err, data) {
        if (err) {
          reject(err);
        } else {
          resolve(data.Body!.toString());
        }
      }
    );
  });
};

export const writeManifest = (filePath, data) => {
  const jsonPromise = new Promise(function(resolve, reject) {
    const file = parseFilePath(filePath);
    s3.putObject(
      {
        Bucket: file.bucket,
        Key: file.key,
        Body: data,
        ContentType: 'application/json',
        CacheControl: 'public, must-revalidate, max-age=0',
        ACL: 'public-read',
      },
      function(err) {
        if (err) reject(err);
        else resolve();
      }
    );
  });

  const jsPromise = new Promise(function(resolve, reject) {
    const file = parseFilePath(filePath);
    const jsKey = getJsPath(file.key);

    s3.putObject(
      {
        Bucket: file.bucket,
        Key: jsKey,
        Body: createJsString(data),
        ContentType: 'application/javascript',
        CacheControl: 'public, must-revalidate, max-age=0',
        ACL: 'public-read',
      },
      function(err) {
        if (err) reject(err);
        else resolve();
      }
    );
  });

  return Promise.all([jsonPromise, jsPromise]);
};
