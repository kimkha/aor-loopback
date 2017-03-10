# Loopback-style REST Client for Admin-on-rest

Loopback-style REST Client for [admin-on-rest](https://github.com/marmelab/admin-on-rest), the frontend framework for building admin applications on top of REST services.

## How to use

1. `yarn add aor-loopback`
2. On your `App.js`, add this:

```
import loopbackRestClient from 'aor-loopback';

...

    <Admin restClient={loopbackRestClient('http://my.api.url/api')} ...>
```

## License

This module is licensed under the [MIT Licence](LICENSE).
