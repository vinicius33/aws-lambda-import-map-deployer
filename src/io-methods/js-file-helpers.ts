export const getJsPath = filePath =>
  filePath.substring(0, filePath.lastIndexOf('.')) + '.js';

export const createJsString = jsonManifestString =>
  `SystemJS.config(${jsonManifestString})`;
