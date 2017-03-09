# Vietnamese Translations for Admin-on-rest

Vietnamese translations for [admin-on-rest](https://github.com/marmelab/admin-on-rest), the frontend framework for building admin applications on top of REST services.

![admin-on-rest demo](http://static.marmelab.com/admin-on-rest.gif)

## Installation

```sh
npm install --save aor-language-vietnamese
```

## Usage

```js
import vietnameseMessages from 'aor-language-vietnamese';

const messages = {
    'vi': vietnameseMessages,
};

<Admin locale="vi" messages={messages}>
  ...
</Admin>
```

## License

This translation is licensed under the [MIT Licence](LICENSE).
