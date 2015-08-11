/**
 * Repository Rest Service
 *
 * Provides API for accessing the engine repository through its REST API.
 */
var vdbBench = (function(vdbBench) {

    vdbBench._module.factory('RepoRestService', [
            'RepoSelectionService',
            'Restangular',
            function(RepoSelectionService, Restangular) {

                /*
                 * Service instance to be returned
                 */
                var service = {};

                // Restangular services keyed by hostname:port
                service.cachedServices = {};

                function url(repo) {
                    return "http://" + repo.hostname + ":" + repo.port + "/";
                }

                function HostNotReachableException(host) {
                    this.host = host;
                    this.message = "The host '" + host + "' is not reachable";
                    this.toString = function() {
                       return this.message;
                    };
                 }

                function hostReachable(host) {

                    // Handle IE and more capable browsers
                    var xhr = new (window.ActiveXObject || XMLHttpRequest) ("Microsoft.XMLHTTP");
                    var status;

                    // Open new request as a HEAD to the root
                    // hostname with a random param to bust the
                    // cache
                    try {
                        xhr.open("HEAD", "//" + host + "/?rand="
                                                      + Math.floor((1 + Math.random()) * 0x10000),
                                                          true);

                        xhr.addEventListener('error', function() {
                            throw new HostNotReachableException(host);
                        });

                        // Issue request and handle response
                        xhr.send();
                        return (xhr.status >= 200 && (xhr.status < 300 || xhr.status === 304));
                    } catch (error) {
                        throw new HostNotReachableException(host);
                    }
                }

                function getRestService() {
                    // Selected repo - should not be null
                    var repo = RepoSelectionService.getSelected();

                    hostReachable(repo.hostname + ":" + repo.port);

                    var baseUrl = url(repo);
                    var restService = service.cachedServices[baseUrl];
                    if (_.isEmpty(restService)) {
                        restService = Restangular.withConfig(function(RestangularConfigurer) {
                            RestangularConfigurer.setBaseUrl(baseUrl);
                            RestangularConfigurer.setRestangularFields(
                                    {
                                        selfLink: '_links[0].href'
                                    });
                        });

                        service.cachedServices[baseUrl] = restService;
                    }

                    return restService;
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
                    var restService = getRestService();
                    return restService.all('vdbs').getList();
                };

                /**
                 * Service: Remove the given vdb
                 */
                service.removeVdb = function(vdb) {
                    return vdb.remove();
                };

                /**
                 * Service: Fetch the xml content of the vdb
                 * Should be required only for preview purposes. Vdbs should be edited
                 * using json, which is more efficient
                 */
                service.getVdbXml = function(vdb) {
                    var links = vdb._links;
                    var xmlLink;
                    for (i = 0; i < links.length; ++i) {
                        var link = links[i];
                        if (links[i].rel == "xml") {
                            xmlLink = links[i].href;
                            break;
                        }
                    }

                    if (xmlLink == null)
                        return null;

                    var restService = getRestService();
                    return restService.one(xmlLink).get();
                }

                return service;
            } ]);

    return vdbBench;

})(vdbBench || {});
