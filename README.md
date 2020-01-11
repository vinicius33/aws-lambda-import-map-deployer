# aws-lambda-import-map-deployer
This is application was an experiment based on the original `import-map-deployer`. It does not intend to cover all cases, in fact, this is meant to be used only with `AWS`.

Since some companies nowadays are based on top of  `serverless architecture`  I've migrated what was needed to deploy this app as an `AWS Lambda`.

FYI, this doesn't intend to replace the original `import-map-deployer` (which is an awesome service).

## Installation and usage
* `yarn install`
* `yarn start` spin up a `serverless-offline` and simulate a `API GW event`
* `yarn deploy` deploy your serverless app based on your `aws account`

## Configuration file
The `aws-lambda-import-map-deployer` expects a configuration file to be present so it (1) can password protect deployments, and (2) knows where and how
to download and update the "live" import map.

Here are the properties available in the config file:
- `manifestFormat` (required): A string that is either `"importmap"` or `"sofe"`, which indicates whether the import-map-deployer is
  interacting with an [import map](https://github.com/WICG/import-maps) or a [sofe manifest](https://github.com/CanopyTax/sofe).
- `locations` (required): An object specifying one or more "locations" (or "environments") for which you want the import-map-deployer to control the import map. The special `default`
  location is what will be used when no query parameter `?env=` is provided in calls to the import-map-deployer. If no `default` is provided, the import-map-deployer will create
  a local file called `import-map.json` that will be used as the import map. The keys in the `locations` object are the names of environments, and the values are
  strings that indicate how the import-map-deployer should interact with the import map for that environment. For more information on the possible string values for locations, see the
  [Built-in IO Methods](#built-in-io-methods) section.
- `username` (required): The username for HTTP auth when calling the import-map-deployer. If username and password are omitted, anyone can update the import map without authenticating. This
  username *is not* related to authenticating with S3/Digital Ocean/Other, but rather is the username your CI process will use in its HTTP request to the import-map-deployer.
- `password` (required): The password for HTTP auth when calling the import-map-deployer. If username and password are omitted, anyone can update the import map without authenticating. This
  password *is not* related to authenticating with S3/Digital Ocean/Other, but rather is the password your CI process will use in its HTTP request to the import-map-deployer.
- `region` (optional): The [AWS region](https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/using-regions-availability-zones.html) to be used when retrieving and updating the import map.
  This can also be specified via the [AWS_DEFAULT_REGION environment variable](https://docs.aws.amazon.com/cli/latest/userguide/cli-configure-envvars.html), which is the preferred method.
- `s3Endpoint` (optional): The url for aws-sdk to call when interacting with S3. Defaults to AWS' default domain, but can be configured for
Digital Ocean Spaces or other S3-compatible APIs.

### json file
The below configuration file will set up the import-map-deployer to do the following:

- Requests to import-map-deployer must use HTTP auth with the provided username and password.
- The import maps are hosted on AWS S3. This is indicated with the `s3://` prefix.
- There are three different import maps being managed by this import-map-deployer: `default`, `prod`, and `test`.

```json
{
  "username": "admin",
  "password": "1234",
  "manifestFormat": "importmap",
  "locations": {
    "default": "import-map.json",
    "prod": "s3://cdn.canopytax.com/import-map.json",
    "test": "import-map-test.json"
  }
}
```

## Built-in IO Methods
The import-map-deployer knows how to update import maps that are stored in the following ways:

### AWS S3
If your import map json file is hosted by AWS S3, you can use the import-map-deployer to modify the import map file
by specifying in your config `s3://` in the `locations` config object.

The format of the string is `s3://bucket-name/file-name.json`

import-map-deployer relies on the [AWS CLI environment variables](https://docs.aws.amazon.com/cli/latest/userguide/cli-configure-envvars.html) for
authentication with S3.

config.json:
```json
{
  "manifestFormat": "importmap",
  "locations": {
    "prod": "s3://mycdn.com/import-map.json",
  }
}
```

## Endpoints

This service exposes the following endpoints

#### GET /environments

You can retrieve the list of environments (locations) a GET request at /environments

Example using [HTTPie](https://github.com/jkbrzt/httpie):

```sh
http :5000/environments
```

Example using cURL:

```sh
curl localhost:5000/environments
```

Response:
```json
{
  "environments": [
    {
      "name": "default",
      "aliases": ["prod"],
      "isDefault": true
    },
    {
      "name": "prod",
      "aliases": ["default"],
      "isDefault": true
    },
    {
      "name": "staging",
      "aliases": [],
      "isDefault": false
    }
  ]
}
```

#### GET /import-map.json?env=prod

You can request the importmap.json file by making a GET request.

Example using [HTTPie](https://github.com/jkbrzt/httpie):

    http :5000/import-map.json\?env=prod

Example using cURL:

    curl localhost:5000/import-map.json\?env=prod

#### PATCH /import-map.json?env=prod

You can modify the import map by making a PATCH request. The import map should be sent in the HTTP request body
and will be merged into the import map controlled by import-map-deployer.

If you have an import map called `importmap.json`, here is how you can merge it into the import map deployer's import map.

Example using [HTTPie](https://github.com/jkbrzt/httpie):

```sh
http PATCH :5000/import-map.json\?env=prod < importmap.json
```

Example using cURL:

```sh
curl -X PATCH localhost:5000/import-map.json\?env=prod --data "@import-map.json" -H "Accept: application/json" -H "Content-Type: application/json"
```

#### PATCH /services?env=stage

You can PATCH services to add or update a service, the following json body is expected:

```json
{
    "service": "my-service",
    "url": "http://example.com/my-service.js"
}
```

Example using HTTPie:

```sh
http PATCH :5000/services\?env=stage service=my-service url=http://example.com/my-service.js
```

Example using cURL:

```sh
curl -d '{ "service":"my-service","url":"http://example.com/my-service.js" }' -X PATCH localhost:5000/services\?env=beta -H "Accept: application/json" -H "Content-Type: application/json"
```

#### DELETE /services/{SERVICE_NAME}?env=alpha

You can remove a service by sending a DELETE with the service name. No request body needs to be sent. Example:

```sh
DELETE /services/my-service
```

Example using HTTPie:

```sh
http DELETE :5000/services/my-service
```

Example using cURL:

```sh
curl -X DELETE localhost:5000/services/my-service
```
