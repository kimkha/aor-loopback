
export default (apiUrl, noAccessPage) => {

    return (type, params) => {
        if (type === 'AUTH_LOGIN') {
            const { username, password } = params;
            const request = new Request(apiUrl, {
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
                    localStorage.setItem('token', id)
                });
        }
        if (type === 'AUTH_LOGOUT') {
            localStorage.removeItem('token');
            return Promise.resolve();
        }
        if (type === 'AUTH_CHECK') {
            return localStorage.getItem('token') ? Promise.resolve() : Promise.reject({ redirectTo: noAccessPage });
        }
        return Promise.reject('Unkown method');
    };
}