import storage from './storage';

export const authClient = (apiUrl, noAccessPage) => {

    return (type, params) => {
        if (type === 'AUTH_LOGIN') {
            const { username, password } = params;
            const request = new Request(apiUrl + '/login', {
                method: 'POST',
                body: JSON.stringify({ username, password }),
                headers: new Headers({ 'Content-Type': 'application/json' }),
            });
            return fetch(request)
                .then(response => {
                    if (response.status < 200 || response.status >= 300) {
                        throw new Error(response.statusText);
                    }
                    return response.json();
                })
                .then(({ id, ttl }) => {
                    storage.save('lbtoken', id, ttl);
                });
        }
        if (type === 'AUTH_LOGOUT') {
            storage.remove('lbtoken');
            return Promise.resolve();
        }
        if (type === 'AUTH_CHECK') {
            return storage.load('lbtoken') ? Promise.resolve() : Promise.reject({ redirectTo: noAccessPage });
        }
        return Promise.reject('Unkown method');
    };
}