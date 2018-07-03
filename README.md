# Loopback-style REST Client for react-admin

Loopback-style REST Client for [react-admin](https://github.com/marmelab/react-admin), the frontend framework for building admin applications on top of REST services.

## Important note

Because of recent changes of **react-admin**, this module will only support version 0.9.0 (or later) of react-admin.

## Prerequisite

* Your loopback server must response `X-Total-Count` header when querying list. Please use [loopback3-xTotalCount](https://github.com/kimkha/loopback3-xTotalCount) on your server end.

## How to use

1. `yarn add aor-loopback`
2. On your `App.js`, add this:

```
import loopbackRestClient from 'aor-loopback';

...

    <Admin restClient={loopbackRestClient('http://my.api.url/api')} ...>
```

3. If you want this module handle authentication, add this:

```
import loopbackRestClient, {authClient} from 'aor-loopback';

...

    <Admin restClient={loopbackRestClient('http://my.api.url/api')} authClient={authClient('http://my.api.url/api/users/login')} ...>
```

## Example

Please check example here: [loopback-aor-boilerplate](https://github.com/kimkha/loopback-aor-boilerplate), you should clone it and change your model later.

# Changes in this branch:
* Added DELETE_MANY case for full compatibility with react-admin list view
* Added UPDATE_MANY (untested)

## Loopback changes To use DELETE_MANY and UPDATE_MANY
(TODO: implement as hook in loopback)
1. Add deleteMany and updateMany remote method to your model  (model.js):
```

const _ = require('lodash')

Model.deleteMany = function(ids, callback) {
        var count = 0;
        // Check if persisted model
        if(typeof Model.destroyAll !== 'function') {
            callback(new Error('This method works only with persisted models'));
            return false;
        }
        // Check if id is array 
        if(!_.isArray(ids)) {
            callback(new Error('ids argument has to be an array'));
            return false;
        }
        Model.destroyAll({id: {inq: ids}}, (err, info) => {
            if(err) {
                callback(err);
                return false;
            }
            callback(null, {data: info});
        })
    };
Model.remoteMethod('deleteMany', {
    description: "Deletes several record corresponding to array of IDs",
    accepts: {
        arg: "ids",
        type: "array",
        required: true,
        description: "Array of IDs to delete"
    },
    returns: { 
        arg: "payload",
        type: "number",
        root: false,
        description: "Number of deleted items"
    },
    http: {
        "path": "/deleteMany",
        "verb": "delete"
    }
})

Model.updateMany = function(params, callback) {
        var count = 0;
        var ids = params.ids;
        delete params.ids;

        // Check if persisted model
        if(typeof Model.updateAll !== 'function') {
            callback(new Error('This method works only with persisted models'));
            return false;
        }
        // Check if id is array 
        if(!_.isArray(ids)) {
            callback(new Error('ids argument has to be an array'));
            return false;
        }
        Model.updateAll({id: {inq: ids}}, params, (err, info) => {
            callback(null, {data: info});
        })
    };

Model.remoteMethod('updateMany', {
    description: "Updates several record corresponding to array of IDs",
    accepts: {
        arg: "params",
        type: "object",
        required: true,
        description: "Object with IDs and fields to update"
    },
    returns: { 
        arg: "payload",
        type: "number",
        root: false,
        description: "Number of updated items"
    },
    http: {
        "path": "/updateMany",
        "verb": "patch"
    }
})
```

## Using Loopback ACL

1. In the App.js add this:
```
<Admin restClient={loopbackRestClient('http://my.api.url/api')} ...>

```

## License

This module is licensed under the [MIT Licence](LICENSE).
