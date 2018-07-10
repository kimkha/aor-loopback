import storage from './storage';

//TV: Changed loginApiUrl to ApiUrl
export const authClient = (ApiUrl, noAccessPage = '/login') => {

    return (type, params) => {
        if (type === 'AUTH_LOGIN') {
            const request = new Request( ApiUrl + '/customers/login?include=user', {
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
                    return Promise.resolve();
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
        //TV: Added AUTH_GET_PERMISSIONS
        if (type === 'AUTH_GET_PERMISSIONS') {
            //get Role from API with token and userid
            const userValues = storage.load('lbtoken');
            const token = userValues.id
            const userId = userValues.user.id;

            //TV: Document getRolesById function
            const request = new Request(ApiUrl + '/customers/getRolesById?access_token=' + token, {
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
                    //console.log(response);
                    let role = response.payload.roles[0];
                    role = role !== '' ? role : 'user';
                    return Promise.resolve(role);
                });
                
        }
        return Promise.reject('Unkown method');
    };
};
