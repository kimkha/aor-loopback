import storage from './storage';

export const authClient = (loginApiUrl, noAccessPage = '/login') => {

    return (type, params) => {
        if (type === 'AUTH_LOGIN') {
            const request = new Request(loginApiUrl, {
                method: 'POST',
                body: JSON.stringify(params),
                headers: new Headers({ 'Content-Type': 'application/json' }),
            });
            return fetch(request)
                .then(response => {
                    if (response.status < 200 || response.status >= 300) {
                        throw new Error(response.statusText);
                    }
                    return response.json();
                })
                .then(({ ttl, ...data }) => {
                    storage.save('lbtoken', data, ttl);
                });
        }
        if (type === 'AUTH_LOGOUT') {
            storage.remove('lbtoken');
            return Promise.resolve();
        }
        if (type === 'AUTH_ERROR') {
            const status  = params.message.status;
            if (status === 401 || status === 403) {
                storage.remove('lbtoken');
                return Promise.reject();
            }
            return Promise.resolve();
        }
        if (type === 'AUTH_CHECK') {
            const token = storage.load('lbtoken');
            if (token && token.id) {
                return Promise.resolve();
            } else {
                storage.remove('lbtoken');
                return Promise.reject({ redirectTo: noAccessPage });
            }
        }
        if (type === 'AUTH_GET_PERMISSIONS') {
            //get Role from API with token and userid
            let token = localStorage.getItem('token');
            let userId = localStorage.getItem('userId');
            const request = new Request(config.config.apiRoot + '/customers/getRolesById?access_token=' + token, {
                method: 'POST',
                body: JSON.stringify({ id: userId }),
                headers: new Headers({ 'Content-Type': 'application/json' }),
            })
            return fetch(request)
                .then(response => {
                    if (response.status < 200 || response.status >= 300) {
                        throw new Error(response.statusText);
                    }
                    return response.json();
                })
                .then(response => {
                    return response.payload.roles;
                });
        }
        return Promise.reject('Unkown method');
    };
};
