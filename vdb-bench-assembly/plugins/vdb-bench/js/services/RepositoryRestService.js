/**
 * Repository Rest Service
 *
 * Provides API for accessing the engine repository through its REST API.
 */
var vdbBench = (function(vdbBench) {

    vdbBench._module.factory('RepoRestService', [
            'SYNTAX',
            'VDB_SCHEMA',
            'VDB_KEYS',
            'RepoSelectionService',
            'Restangular',
            '$http',
            '$q',
            function(SYNTAX, VDB_SCHEMA, VDB_KEYS, RepoSelectionService, Restangular, $http, $q) {

                /*
                 * Service instance to be returned
                 */
                var service = {};

                // Restangular services keyed by hostname:port/baseUrl
                service.cachedServices = {};

                function url(repo) {
                    return "http://" + repo.hostname + ":" + repo.port + repo.baseUrl;
                }

                function HostNotReachableException(host) {
                    this.host = host;
                    this.message = "The host '" + host + "' is not reachable";
                    this.toString = function() {
                       return this.message;
                    };
                 }

                function getRestService() {
                    // Selected repo - should not be null
                    var repo = RepoSelectionService.getSelected();
                    var baseUrl = url(repo);
                    var restService = service.cachedServices[baseUrl];
                    if (! _.isEmpty(restService)) {
                        //
                        // Want to be consistent in the function's return type
                        // Promise will resolve immediately upon return.
                        //
                        return $q.when(restService);
                    }

                    var testUrl = baseUrl + SYNTAX.FORWARD_SLASH + VDB_KEYS.VDBS;
                    return $http.get(testUrl).
                        then(function (response) {
                            restService = Restangular.withConfig(function (RestangularConfigurer) {
                                RestangularConfigurer.setBaseUrl(baseUrl);
                                RestangularConfigurer.setRestangularFields(
                                    {
                                        selfLink: VDB_KEYS.LINKS + '[0].href'
                                    });
                            });

                            service.cachedServices[baseUrl] = restService;
                            return restService;

                        }, function (response) {
                            // called asynchronously if an error occurs
                            // or server returns response with an error status.
                            throw new HostNotReachableException(baseUrl);
                        });
                }

                /**
                 * Service: return the link HREF value for the given
                 * link type from the given rest object
                 */
                service.getLink = function(linkType, restObject) {
                    if (! linkType || ! restObject)
                        return null;

                    var links = restObject[VDB_KEYS.LINKS.ID];
                    if (! links)
                        return null;

                    for (var i = 0; i < links.length; ++i) {
                        if (links[i][VDB_KEYS.LINKS.NAME] == linkType)
                            return links[i][VDB_KEYS.LINKS.HREF];
                    }

                    return null;
                }

                /**
                 * Copy the source object to the destination
                 */
                service.copy = function(src, dst) {
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
                service.getVdbs = function() {
                    return getRestService().then(function(restService) {
                        return restService.all(VDB_KEYS.VDBS).getList();
                    });
                };

                /**
                 * Service: Remove the given vdb
                 * Returns: promise object for the removal
                 */
                service.removeVdb = function(vdb) {
                    return vdb.remove();
                };

                /**
                 * Service: Fetch the content from the link (in json)
                 * Returns: promise object for the content
                 */
                service.getContent = function(link) {
                    if (! link)
                        return null;

                    return getRestService().then(function(restService) {
                        /*
                        * Uses the link from the parent object to fetch the content.
                        * By passing the Accept header, we ensure that only the json version can be returned.
                        */
                        return restService.all(link).customGETLIST("", {}, { 'Accept' : 'application/json' });
                    });
                }

                /**
                 * Service: Fetch the xml content of the vdb
                 * Returns: promise object for the xml content
                 *
                 * Should be required only for preview purposes. Vdbs should be edited
                 * using json, which is more efficient
                 */
                service.getXml = function(vdb) {
                    if (!vdb)
                        return null;

                    var vdbId = vdb[VDB_KEYS.ID];
                    if (!vdbId)
                        return null;

                    var link = VDB_KEYS.VDBS + SYNTAX.FORWARD_SLASH + vdbId;
                    return getRestService().then(function(restService) {
                        /*
                        * Uses the content link from the vdb and fetch the xml version of the content.
                        * By passing the Accept header, we ensure that only the xml version can be returned.
                        */
                        return restService.one(link).customGET("", {}, { 'Accept' : 'application/xml' });
                    });
                }

                /**
                 * Service: Fetch the schema content for the given
                 * element type, eg. Vdb, Model, Source, Translator.
                 */
                service.getSchemaById = function(id) {
                    return getRestService().then(function(restService) {
                        if (id == null)
                            return null;

                        return restService.one(VDB_SCHEMA.SCHEMA, id).get();
                    });
                }

                /**
                 * Service: Fetch the schema content for the given
                 * komodo type, eg. VDB, VDB_MODEL, VDB_MODEL_SOURCE
                 */
                service.getSchemaByKType = function(kType) {
                    return getRestService().then(function(restService) {
                        if (kType == null)
                            return null;

                        return restService.one(VDB_SCHEMA.SCHEMA).customGET('', { ktype : kType });
                    });
                }

                return service;
            } ]);

    return vdbBench;

})(vdbBench || {});
