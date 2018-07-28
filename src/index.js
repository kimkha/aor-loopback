import {queryParameters, fetchJson} from './fetch';
import {
    GET_LIST,
    GET_ONE,
    GET_MANY,
    GET_MANY_REFERENCE,
    CREATE,
    UPDATE,
    UPDATE_MANY,
    DELETE,
    DELETE_MANY
} from './types';

export * from './authClient';

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
export default (apiUrl, httpClient = fetchJson) => {
    /**
     * @param {String} type One of the constants appearing at the top if this file, e.g. 'UPDATE'
     * @param {String} resource Name of the resource to fetch, e.g. 'posts'
     * @param {Object} params The REST request params, depending on the type
     * @returns {Object} { url, options } The HTTP request parameters
     */

    const aclLink = (acl) => {
        if(typeof acl == 'undefined') {
            return apiUrl;
        } else {
            return `${apiUrl}/${acl.ParentResource}/${acl.ParentId}`
        }
    }

    const convertRESTRequestToHTTP = (type, resource, params) => {
        resource = resource.toLowerCase();
        let url = '';
        const options = {};
        let acl;
        let specialSearch;
        if(typeof params.filter == 'object') {
            acl = params.filter.acl;
            delete params.filter.acl;
            specialSearch = params.filter.specialSearch;
            delete params.filter.specialSearch
        } else if(params.data && params.data.ParentResource !== undefined && params.data.ParentResource !== '' ) {
            acl = {};
            acl.ParentResource = params.data.ParentResource;
            acl.ParentId = params.data.ParentId;
            delete(params.ParentId);
            delete(params.data.ParentResource);
        }

        switch (type) {
            case GET_LIST: {
                const {page, perPage} = params.pagination;
                const {field, order} = params.sort;
                const query = {};
                const filters = {...params.filter};
                
                if(specialSearch === undefined) query['where'] = filters;
                else {
                    query['where'] = specialSearchToWhere(specialSearch, filters);
                }
                if (field) query['order'] = [field + ' ' + order];
                if (perPage > 0) {
                    query['limit'] = perPage;
                    if (page >= 0) {
                        query['skip'] = (page - 1) * perPage;
                    }
                }
                url = aclLink(acl) + `/${resource}?${queryParameters({filter: JSON.stringify(query)})}`;
                break;
            }
            case GET_ONE:
                url = aclLink(acl) + `/${resource}/${params.id}`;
                break;
            case GET_MANY: {
                const listId = params.ids.map(id => {
                    return {'id': id};
                });
                const query = {
                    'where': {'or': listId}
                };
                url =  aclLink(acl) + `/${resource}?${queryParameters({filter: JSON.stringify(query)})}`;
                break;
            }
            case GET_MANY_REFERENCE: {
                const {page, perPage} = params.pagination;
                const {field, order} = params.sort;
                const query = {};
                query['where'] = {...params.filter};
                query['where'][params.target] = params.id;
                if (field) query['order'] = [field + ' ' + order];
                if (perPage > 0) {
                    query['limit'] = perPage;
                    if (page >= 0) {
                        query['skip'] = (page - 1) * perPage;
                    }
                }
                url =  aclLink(acl) + `/${resource}?${queryParameters({filter: JSON.stringify(query)})}`;
                break;
            }
            case UPDATE:
                url =  aclLink(acl) + `/${resource}/${params.id}`;
                options.method = 'PUT';
                options.body = JSON.stringify(params.data);
                break;
            case CREATE:
                url =  aclLink(acl) + `/${resource}`;
                options.method = 'POST';
                options.body = JSON.stringify(params.data);
                break;
            case DELETE:
                url =  aclLink(acl) + `/${resource}/${params.id}`;
                options.method = 'DELETE';
                break;
            case DELETE_MANY: 
                // We use custom function so we don't need ACL
                url =  `${apiUrl}/${resource}/deleteMany`;
                options.body = JSON.stringify({ids: params.ids});
                options.method = 'DELETE';
                break;
            case UPDATE_MANY:
                // We use custom function so we don't need ACL
                url =  `${apiUrl}/${resource}/updateMany`;
                options.body = JSON.stringify(params.data);
                options.method = 'PUT';
                break;
            default:
                throw new Error(`Unsupported fetch action type ${type}`);
        }
        return {url, options};
    };

    /**
     * @param {Object} response HTTP response from fetch()
     * @param {String} type One of the constants appearing at the top if this file, e.g. 'UPDATE'
     * @param {String} resource Name of the resource to fetch, e.g. 'posts'
     * @param {Object} params The REST request params, depending on the type
     * @returns {Object} REST response
     */
    const convertHTTPResponseToREST = (response, type, resource, params) => {
        const {headers, json} = response;
        switch (type) {
            case GET_LIST:
            case GET_MANY_REFERENCE:
                if (!headers.has('x-total-count')) {
                    throw new Error('The X-Total-Count header is missing in the HTTP Response. The jsonServer REST client expects responses for lists of resources to contain this header with the total number of results to build the pagination. If you are using CORS, did you declare X-Total-Count in the Access-Control-Expose-Headers header?');
                }
                return {
                    data: json,
                    total: parseInt(headers.get('x-total-count').split('/').pop(), 10),
                };
            case CREATE:
                return { data: { ...params.data, id: json.id } };
            default:
                return { data: json };
        }
    };

    /**
     * @param {string} type Request type, e.g GET_LIST
     * @param {string} resource Resource name, e.g. "posts"
     * @param {Object} payload Request parameters. Depends on the request type
     * @returns {Promise} the Promise for a REST response
     */
    return (type, resource, params) => {
        const {url, options} = convertRESTRequestToHTTP(type, resource, params);
        return httpClient(url, options)
            .then(response => convertHTTPResponseToREST(response, type, resource, params));
    };
};


function specialSearchToWhere(options, filters) {
    if(Object.keys(filters).length === 0) return; //No search term

    let or = [];
    let res = {};
    for(let prop in filters) {
        options.multipleSearch.forEach((field) => {
            filters[field] = filters[prop];
        })
    }
    if(options.searchByParts) {
        for(let prop in filters) {
            let resFilter = {};
            resFilter[prop] = {};
            resFilter[prop]['regexp'] = "/.*?" + filters[prop]+ ".*?/i";
            or.push(resFilter);
        }
    }
    console.log(or);
    res['or'] = or;
    return res
} 