// File editing
import rwlock from 'rwlock';
import { readManifest, writeManifest } from './io-methods/default';

const lock = new rwlock();

function getMapFromManifest(manifest) {
  return manifest.imports;
}

export function getEmptyManifest() {
  return { imports: {} };
}

export const modifyService = (env, serviceName, url, remove?) => {
  return new Promise((resolve, reject) => {
    // obtain lock (we need a global lock so deploys dont have a race condition)
    lock.writeLock(release => {
      // read file as json
      const manifestPromise = readManifest(env)
        .then(data => {
          var json;
          if (data === '') {
            json = getEmptyManifest();
          } else {
            try {
              json = JSON.parse(data as string);
            } catch (ex) {
              release();
              reject('Manifest is not valid json -- ' + ex);
              return;
            }
          }

          // modify json
          if (remove) {
            delete getMapFromManifest(json)[serviceName];
          } else {
            getMapFromManifest(json)[serviceName] = url;
          }

          // write json to file
          var string = JSON.stringify(json, null, 2);
          return writeManifest(string, env).then(() => {
            release();
            return json;
          });
        })
        .catch(ex => {
          release();
          throw ex;
        });

      resolve(manifestPromise);
    });
  });
};

export const modifyMultipleServices = (env, newImports) => {
  return new Promise(resolve => {
    lock.writeLock(releaseLock => {
      const resultPromise = readManifest(env)
        .then(data => {
          const json = data ? JSON.parse(data as string) : getEmptyManifest();

          const imports = getMapFromManifest(json);
          Object.assign(imports, newImports);

          const newImportMapString = JSON.stringify(json, null, 2);
          return writeManifest(newImportMapString, env).then(() => {
            releaseLock();
            return json;
          });
        })
        .catch(err => {
          releaseLock();
          throw err;
        });

      resolve(resultPromise);
    });
  });
};
