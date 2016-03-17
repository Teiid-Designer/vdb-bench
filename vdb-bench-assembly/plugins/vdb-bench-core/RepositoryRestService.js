/**
 * Workspace Rest Service
 *
 * Provides API for accessing the engine repository through its REST API.
 */
(function () {

    'use strict';

    angular
        .module('vdb-bench.core')
        .factory('RepoRestService', RepoRestService);

    RepoRestService.$inject = ['SYNTAX', 'REST_URI', 'VDB_SCHEMA',
                                             'VDB_KEYS', 'RepoSelectionService', 'Restangular',
                                             '$http', '$q'];

    function RepoRestService(SYNTAX, REST_URI, VDB_SCHEMA, VDB_KEYS, RepoSelectionService, Restangular, $http, $q) {

        /*
         * Service instance to be returned
         */
        var service = {};

        // Restangular services keyed by host:port/baseUrl
        service.cachedServices = {};

        function url(repo) {
            return "http://" + repo.host + ":" + repo.port + repo.baseUrl;
        }

        function HostNotReachableException(host, reason) {
            this.host = host;
            this.message = "The host '" + host + "' is not reachable: " + reason;
            this.toString = function () {
                return this.message;
            };
        }
        HostNotReachableException.prototype = new Error();
        HostNotReachableException.prototype.constructor = HostNotReachableException;

        /**
         * Get the rest service based on the selected repo's baseUrl value.
         * Used in most cases when the URI has segments to be appended
         * to this baseUrl.
         */
        function getRestService() {
            // Selected repo - should not be null
            var repo = RepoSelectionService.getSelected();
            var baseUrl = url(repo);
            var restService = service.cachedServices[baseUrl];
            if (!_.isEmpty(restService)) {
                //
                // Want to be consistent in the function's return type
                // Promise will resolve immediately upon return.
                //
                return $q.when(restService);
            }

            var testUrl = baseUrl + REST_URI.WORKSPACE + REST_URI.VDBS;
            return $http.get(testUrl).
            then(function (response) {
                restService = Restangular.withConfig(function (RestangularConfigurer) {
                    RestangularConfigurer.setBaseUrl(baseUrl);
                    RestangularConfigurer.setRestangularFields({
                        selfLink: VDB_KEYS.LINKS + '[0].href'
                    });
                });

                service.cachedServices[baseUrl] = restService;
                return restService;

            }, function (response) {
                // called asynchronously if an error occurs
                // or server returns response with an error status.
                throw new HostNotReachableException(baseUrl, 'Status code: ' + response.status);
            });
        }

        /**
         * Service: return the link HREF value for the given
         * link type from the given rest object
         */
        service.getLink = function (linkType, restObject) {
            if (!linkType || !restObject)
                return null;

            var links = restObject[VDB_KEYS.LINKS.ID];
            if (!links)
                return null;

            for (var i = 0; i < links.length; ++i) {
                if (links[i][VDB_KEYS.LINKS.NAME] == linkType)
                    return links[i][VDB_KEYS.LINKS.HREF];
            }

            return null;
        };

        /**
         * Copy the source object to the destination
         */
        service.copy = function (src, dst) {
            /*
             * In normal $resource/ng projects use:
             * angular.copy(src, dst) but Restangular has an
             * issue when using angular.copy():
             * https://github.com/mgonto/restangular/issues/55
             * so use their version of copy():
             */
            Restangular.copy(src, dst);
        };

        /**
         * Service: return the list of existing vdbs
         * Returns: promise object for the vdb collection
         */
        service.getVdbs = function () {
            return getRestService().then(function (restService) {
                return restService.all(REST_URI.WORKSPACE + REST_URI.VDBS).getList();
            });
        };

        /**
         * Service: Remove the given vdb
         * Returns: promise object for the removal
         */
        service.removeVdb = function (vdb) {
            return vdb.remove();
        };

        /**
         * Service: Fetch the elements pointed at by the link (in json)
         * Returns: promise object for a single or list of elements
         *
         */
        service.getTarget = function (link) {
            if (!link)
                return null;

            if (_.startsWith(link, 'http')) {
                //
                // Link is absolute so need to realize a new service
                // and use 'allUrl' to fetch the results
                //  
                var restService = Restangular.withConfig(function (RestangularConfigurer) {
                    RestangularConfigurer.setRestangularFields({
                        selfLink: VDB_KEYS.LINKS + '[0].href'
                    });
                });

                return restService.allUrl(link, link).customGET("", {}, {
                    'Accept': 'application/json'
                });

            } else {

                return getRestService().then(function (restService) {
                    /*
                     * Uses the link from the parent object to fetch the content.
                     * By passing the Accept header, we ensure that only the json version can be returned.
                     */
                    return restService.all(link).customGET("", {}, {
                        'Accept': 'application/json'
                    });
                });
            }
        };

        /**
         * Service: Fetch the xml content of the vdb
         * Returns: promise object for the xml content
         *
         * Should be required only for preview purposes. Vdbs should be edited
         * using json, which is more efficient
         */
        service.getXml = function (vdb) {
            if (!vdb)
                return null;

            var vdbId = vdb[VDB_KEYS.ID];
            if (!vdbId)
                return null;

            var link = REST_URI.WORKSPACE + REST_URI.VDBS + SYNTAX.FORWARD_SLASH + vdbId;
            return getRestService().then(function (restService) {
                /*
                 * Uses the content link from the vdb and fetch the xml version of the content.
                 * By passing the Accept header, we ensure that only the xml version can be returned.
                 */
                return restService.one(link).customGET("", {}, {
                    'Accept': 'application/xml'
                });
            });
        };

        /**
         * Service: Fetch the schema content for the given
         * komodo type, eg. VDB, VDB_MODEL, VDB_MODEL_SOURCE
         */
        service.getSchemaByKType = function (kType) {
            return getRestService().then(function (restService) {
                if (!kType)
                    return null;

                return restService.one(REST_URI.SERVICE + REST_URI.SCHEMA).customGET('', {
                    ktype: kType
                });
            });
        };

        /**
         * Service: Search the resposiory with the given searchAttributes
         * formatted with the following object:
         *
         * {
         *    searchName: <search save name>,
         *    type: <type of objects to return>,
         *    parent: <the object who is the root of the search>,
         *    ancestor: <the ancestor of the object>,
         *    path: <the datapath of a specific object>,
         *    contains: <contains term>
         *    objectName: <objectName term>
         * }
         */
        service.search = function (searchAttributes) {
            return getRestService().then(function (restService) {
                if (!searchAttributes)
                    return null;

                // Posts should always be made on collection (all) not elements (one)
                return restService.all(REST_URI.WORKSPACE + REST_URI.SEARCH).post(searchAttributes);
            });
        };

        /**
         * Service: Get the collection of saved searches
         */
        service.getSearches = function () {
            return getRestService().then(function (restService) {
                return restService.all(REST_URI.WORKSPACE + REST_URI.SEARCH + REST_URI.SAVED_SEARCHES).getList();
            });
        };

        /**
         * Service: Save a search to the resposiory
         * formatted with the following object:
         *
         * {
         *    searchName: <search save name>,
         *    type: <type of objects to return>,
         *    parent: <the object who is the root of the search>,
         *    ancestor: <the ancestor of the object>,
         *    path: <the datapath of a specific object>,
         *    contains: <contains term>
         *    objectName: <objectName term>
         * }
         */
        service.saveSearch = function (searchAttributes) {
            return getRestService().then(function (restService) {
                if (!searchAttributes)
                    return null;

                return restService.all(REST_URI.WORKSPACE + REST_URI.SEARCH + REST_URI.SAVED_SEARCHES).post(searchAttributes);
            });
        };

        /**
         * Service: delete a search from the resposiory
         */
        service.deleteSavedSearch = function (searchName) {
            return getRestService().then(function (restService) {
                if (!searchName)
                    return null;

                return restService.one(REST_URI.WORKSPACE + REST_URI.SEARCH + REST_URI.SAVED_SEARCHES +
                    SYNTAX.FORWARD_SLASH + searchName).remove();
            });
        };

        function RestServiceException(message) {
            this.message = message;
            this.toString = function () {
                return this.message;
            };
        }
        RestServiceException.prototype = new Error();
        RestServiceException.prototype.constructor = RestServiceException;

        service.newRestException = function(message) {
            return new RestServiceException(message);
        };

        return service;
    }

})();