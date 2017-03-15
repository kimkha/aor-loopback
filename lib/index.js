'use strict';

Object.defineProperty(exports, "__esModule", {
    value: true
});

var _extends = Object.assign || function (target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i]; for (var key in source) { if (Object.prototype.hasOwnProperty.call(source, key)) { target[key] = source[key]; } } } return target; };

var _authClient = require('./authClient');

Object.keys(_authClient).forEach(function (key) {
    if (key === "default" || key === "__esModule") return;
    Object.defineProperty(exports, key, {
        enumerable: true,
        get: function get() {
            return _authClient[key];
        }
    });
});

var _fetch = require('./fetch');

var _types = require('./types');

/**
 * Maps admin-on-rest queries to a loopback powered REST API
 *
 * @see https://github.com/strongloop/loopback
 * @example
 * GET_LIST     => GET http://my.api.url/posts?filter[sort]="title ASC"&filter[skip]=0&filter[limit]=20
 * GET_ONE      => GET http://my.api.url/posts/123
 * GET_MANY     => GET http://my.api.url/posts?filter[where][or]=[{id:123},{id:456}]
 * UPDATE       => PUT http://my.api.url/posts/123
 * CREATE       => POST http://my.api.url/posts/123
 * DELETE       => DELETE http://my.api.url/posts/123
 */
exports.default = function (apiUrl) {
    var httpClient = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : _fetch.fetchJson;

    /**
     * @param {String} type One of the constants appearing at the top if this file, e.g. 'UPDATE'
     * @param {String} resource Name of the resource to fetch, e.g. 'posts'
     * @param {Object} params The REST request params, depending on the type
     * @returns {Object} { url, options } The HTTP request parameters
     */
    var convertRESTRequestToHTTP = function convertRESTRequestToHTTP(type, resource, params) {
        resource = resource.toLowerCase();
        var url = '';
        var options = {};
        switch (type) {
            case _types.GET_LIST:
                {
                    var _params$pagination = params.pagination,
                        page = _params$pagination.page,
                        perPage = _params$pagination.perPage;
                    var _params$sort = params.sort,
                        field = _params$sort.field,
                        order = _params$sort.order;

                    var query = {};
                    query['where'] = _extends({}, params.filter);
                    if (field) query['order'] = [field + ' ' + order];
                    if (perPage > 0) {
                        query['limit'] = perPage;
                        if (page >= 0) {
                            query['skip'] = (page - 1) * perPage;
                        }
                    }
                    url = apiUrl + '/' + resource + '?' + (0, _fetch.queryParameters)({ filter: JSON.stringify(query) });
                    break;
                }
            case _types.GET_ONE:
                url = apiUrl + '/' + resource + '/' + params.id;
                break;
            case _types.GET_MANY:
                {
                    var listId = params.ids.map(function (id) {
                        return { 'id': id };
                    });
                    var _query = {
                        'where': { 'or': listId }
                    };
                    url = apiUrl + '/' + resource + '?' + (0, _fetch.queryParameters)({ filter: _query });
                    break;
                }
            case _types.GET_MANY_REFERENCE:
                {
                    var _params$pagination2 = params.pagination,
                        _page = _params$pagination2.page,
                        _perPage = _params$pagination2.perPage;
                    var _params$sort2 = params.sort,
                        _field = _params$sort2.field,
                        _order = _params$sort2.order;

                    var _query2 = {};
                    _query2['where'] = _extends({}, params.filter);
                    _query2['where'][params.target] = params.id;
                    if (_field) _query2['order'] = [_field + ' ' + _order];
                    if (_perPage > 0) {
                        _query2['limit'] = _perPage;
                        if (_page >= 0) {
                            _query2['skip'] = (_page - 1) * _perPage;
                        }
                    }
                    url = apiUrl + '/' + resource + '?' + (0, _fetch.queryParameters)({ filter: _query2 });
                    break;
                }
            case _types.UPDATE:
                url = apiUrl + '/' + resource + '/' + params.id;
                options.method = 'PUT';
                options.body = JSON.stringify(params.data);
                break;
            case _types.CREATE:
                url = apiUrl + '/' + resource;
                options.method = 'POST';
                options.body = JSON.stringify(params.data);
                break;
            case _types.DELETE:
                url = apiUrl + '/' + resource + '/' + params.id;
                options.method = 'DELETE';
                break;
            default:
                throw new Error('Unsupported fetch action type ' + type);
        }
        return { url: url, options: options };
    };

    /**
     * @param {Object} response HTTP response from fetch()
     * @param {String} type One of the constants appearing at the top if this file, e.g. 'UPDATE'
     * @param {String} resource Name of the resource to fetch, e.g. 'posts'
     * @param {Object} params The REST request params, depending on the type
     * @returns {Object} REST response
     */
    var convertHTTPResponseToREST = function convertHTTPResponseToREST(response, type, resource, params) {
        var headers = response.headers,
            json = response.json;

        switch (type) {
            case _types.GET_LIST:
                if (!headers.has('x-total-count')) {
                    throw new Error('The X-Total-Count header is missing in the HTTP Response. The jsonServer REST client expects responses for lists of resources to contain this header with the total number of results to build the pagination. If you are using CORS, did you declare X-Total-Count in the Access-Control-Expose-Headers header?');
                }
                return {
                    data: json.map(function (x) {
                        return x;
                    }),
                    total: parseInt(headers.get('x-total-count').split('/').pop(), 10)
                };
            case _types.CREATE:
                return _extends({}, params.data, { id: json.id });
            default:
                return json;
        }
    };

    /**
     * @param {string} type Request type, e.g GET_LIST
     * @param {string} resource Resource name, e.g. "posts"
     * @param {Object} payload Request parameters. Depends on the request type
     * @returns {Promise} the Promise for a REST response
     */
    return function (type, resource, params) {
        var _convertRESTRequestTo = convertRESTRequestToHTTP(type, resource, params),
            url = _convertRESTRequestTo.url,
            options = _convertRESTRequestTo.options;

        return httpClient(url, options).then(function (response) {
            return convertHTTPResponseToREST(response, type, resource, params);
        });
    };
};