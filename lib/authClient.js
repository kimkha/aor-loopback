'use strict';

Object.defineProperty(exports, "__esModule", {
    value: true
});
var authClient = exports.authClient = function authClient(apiUrl, noAccessPage) {

    return function (type, params) {
        if (type === 'AUTH_LOGIN') {
            var username = params.username,
                password = params.password;

            var request = new Request(apiUrl + '/login', {
                method: 'POST',
                body: JSON.stringify({ username: username, password: password }),
                headers: new Headers({ 'Content-Type': 'application/json' })
            });
            return fetch(request).then(function (response) {
                if (response.status < 200 || response.status >= 300) {
                    throw new Error(response.statusText);
                }
                return response.json();
            }).then(function (_ref) {
                var id = _ref.id;

                localStorage.setItem('lbtoken', id);
            });
        }
        if (type === 'AUTH_LOGOUT') {
            localStorage.removeItem('lbtoken');
            return Promise.resolve();
        }
        if (type === 'AUTH_CHECK') {
            return localStorage.getItem('lbtoken') ? Promise.resolve() : Promise.reject({ redirectTo: noAccessPage });
        }
        return Promise.reject('Unkown method');
    };
};