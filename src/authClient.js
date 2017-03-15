
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
                .then(({ id }) => {
                    localStorage.setItem('lbtoken', id)
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
}