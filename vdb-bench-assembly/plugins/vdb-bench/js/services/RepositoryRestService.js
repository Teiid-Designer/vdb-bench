/**
 * Repository Rest Service
 *
 * Provides API for accessing the engine repository through its REST API.
 */
var vdbBench = (function(vdbBench) {

    vdbBench._module.factory('RepoRestService', [
            'RepoSelectionService',
            'Restangular',
            '$http',
            '$q',
            function(RepoSelectionService, Restangular, $http, $q) {

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

                    var testUrl = baseUrl + "/vdbs";
                    return $http.get(testUrl).
                        then(function (response) {
                            restService = Restangular.withConfig(function (RestangularConfigurer) {
                                RestangularConfigurer.setBaseUrl(baseUrl);
                                RestangularConfigurer.setRestangularFields(
                                    {
                                        selfLink: '_links[0].href'
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

                function getContentLink(vdb) {
                    var links = vdb._links;
                    for (i = 0; i < links.length; ++i) {
                        var link = links[i];
                        if (links[i].rel == "content")
                            return links[i].href;
                    }

                    return null;
                }

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
                 */
                service.getVdbs = function() {
                    return getRestService().then(function(restService) {
                        return restService.all('vdbs').getList();
                    });
                };

                /**
                 * Service: Remove the given vdb
                 */
                service.removeVdb = function(vdb) {
                    return vdb.remove();
                };

                /**
                 * Service: Fetch the content (in json) of the vdb
                 */
                service.getVdbContent = function(vdb) {
                    var contentLink = getContentLink(vdb);
                    if (contentLink == null)
                        return null;

                    return getRestService().then(function(restService) {
                        /*
                        * Uses the content link from the vdb and fetch the xml version of the content.
                        * By passing the Accept header, we ensure that only the xml version can be returned.
                        */
                        return restService.one(contentLink).customGET("", {}, { 'Accept' : 'application/json' });
                    });
                }

                /**
                 * Service: Fetch the xml content of the vdb
                 * Should be required only for preview purposes. Vdbs should be edited
                 * using json, which is more efficient
                 */
                service.getVdbXml = function(vdb) {
                    var contentLink = getContentLink(vdb);
                    if (contentLink == null)
                        return null;

                    return getRestService().then(function(restService) {
                        /*
                        * Uses the content link from the vdb and fetch the xml version of the content.
                        * By passing the Accept header, we ensure that only the xml version can be returned.
                        */
                        return restService.one(contentLink).customGET("", {}, { 'Accept' : 'application/xml' });
                    });
                }

                return service;
            } ]);

    return vdbBench;

})(vdbBench || {});
