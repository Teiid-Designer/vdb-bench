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

    RepoRestService.$inject = ['CONFIG', 'SYNTAX', 'REST_URI', 'VDB_SCHEMA',
                                             'VDB_KEYS', 'RepoSelectionService', 'Restangular',
                                             '$http', '$q', '$base64'];

    function RepoRestService(CONFIG, SYNTAX, REST_URI, VDB_SCHEMA, VDB_KEYS, RepoSelectionService, Restangular, $http, $q, $base64) {

        /*
         * Service instance to be returned
         */
        var service = {};

        // Restangular services keyed by host:port/baseUrl
        service.cachedServices = {};

        function url(repo) {
            return CONFIG.restScheme +
                        SYNTAX.COLON + SYNTAX.FORWARD_SLASH + SYNTAX.FORWARD_SLASH +
                        repo.host + SYNTAX.COLON + repo.port + repo.baseUrl;
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
         * returns true if the given vdb is a deployed teiid vdb
         *  false otherwise.
         */
        function isTeiidVdb(vdb) {
            if (! vdb)
                return false;

            if (!vdb.keng__dataPath)
                return false;

            return vdb.keng__dataPath.indexOf('tko:teiidCache') > -1;
        }

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

            var testUrl = baseUrl + REST_URI.SERVICE + REST_URI.ABOUT;
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
         * Service: Try and find the reponse's message and return it
         */
        service.reponseMessage = function(response) {
            if (response.message)
                return response.message;
            else if (response.data && response.data.error)
                return response.data.error;
            else if (response.status && response.statusText)
                return response.status + SYNTAX.COLON + response.statusText;

            return "Unknown Error";
        };

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
        service.getVdbs = function (serviceType) {
            var url = REST_URI.WORKSPACE + REST_URI.VDBS;

            if (serviceType === REST_URI.TEIID_SERVICE)
                url = REST_URI.TEIID + REST_URI.VDBS;

            return getRestService().then(function (restService) {
                return restService.all(url).getList();
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
         * Service: Get available storage types
         * Returns: promise object for the available storage types
         */
        service.availableStorageTypes = function() {
            var url = REST_URI.IMPORT_EXPORT + REST_URI.AVAILABLE_STORAGE_TYPES;

            return getRestService().then(function (restService) {
                return restService.all(url).getList();
            });
        };

        /**
         * Service: Determine the document type from the given file name
         * Returns: the document type for the file or null if not recognised
         */
        service.documentType = function(fileName) {
            //
            // Valid formats currently implemented
            //
            var validFormats = ['zip', '-vdb.xml', 'tds', 'ddl'];
            var documentType = null;
            validFormats.forEach( function(format) {
                if (fileName.endsWith(format)) {
                    documentType = format;
                }
            });

            return documentType;
        };

        /**
         * Service: Import the given file
         * Returns: promise object for the imported item
         */
        service.import = function(storageType, parameters, documentType, data) {
            if (!storageType || !documentType)
                return null;

            parameters = parameters || {};

            var url = REST_URI.IMPORT_EXPORT + REST_URI.IMPORT;

            return getRestService().then(function (restService) {
                var payload = {
                    "storageType": storageType,
                    "documentType": documentType,
                    "parameters" : parameters
                };

                //
                // content is optional and only if data parameter has been defined
                //
                if (angular.isDefined(data)) {
                    data = $base64.encode(data);
                    payload.content = data;
                }

                // Posts should always be made on collection (all) not elements (one)
                return restService.all(url).post(payload);
            });
        };

        /**
         * Service: Upload the given file data. Uses the file storage connector.
         * Returns: promise object for the uploaded item
         */
        service.upload = function(documentType, data) {
            if (!documentType)
                return null;

            return service.import('file', {}, documentType, data);
        };

        /**
         * Service: Export the given artifact
         * Returns: promise object for the exported item
         */
        service.export = function(storageType, parameters, artifact) {
            if (!artifact || !storageType)
                return null;

            parameters = parameters || {};

            var url = REST_URI.IMPORT_EXPORT + REST_URI.EXPORT;

            return getRestService().then(function (restService) {
                var payload = {
                    "storageType": storageType,
                    "parameters" : parameters,
                    "dataPath": artifact[VDB_KEYS.DATA_PATH]
                };

                // Posts should always be made on collection (all) not elements (one)
                return restService.all(url).post(payload);
            });
        };

        /**
         * Service: Download the given artifact. Uses the file storage connector.
         * Returns: promise object for the downloaded item
         */
        service.download = function(artifact) {
            if (!artifact)
                return null;

            return service.export('file', {}, artifact);
        };

        /**
         * Service: return the list of translators.
                         If serviceType is wksp then 'vdbName' is required.
         * Returns: promise object for the translator collection
         */
        service.getTranslators = function (serviceType, vdbName) {
            var url = REST_URI.WORKSPACE + REST_URI.VDBS + vdbName + REST_URI.TRANSLATORS;

            if (serviceType === REST_URI.TEIID_SERVICE)
                url = REST_URI.TEIID + REST_URI.TRANSLATORS;

            return getRestService().then(function (restService) {
                return restService.all(url).getList();
            });
        };

        /**
         * Service: return the list of data services.
         * Returns: promise object for the data service collection
         */
        service.getDataServices = function ( ) {
            var url = REST_URI.WORKSPACE + REST_URI.DATA_SERVICES;

            return getRestService().then(function (restService) {
                return restService.all(url).getList();
            });
        };

        /**
         * Service: Get a data service from the repository
         */
        service.getDataService = function (dataserviceName) {
            return getRestService().then(function (restService) {
                if (!dataserviceName)
                    return null;

                return restService.one(REST_URI.WORKSPACE + REST_URI.DATA_SERVICES + SYNTAX.FORWARD_SLASH + dataserviceName).get();
            });
        };

        /**
         * Service: create a new dataservice in the repository
         */
        service.createDataService = function (dataserviceName, dataserviceDescription) {
            if (!dataserviceName) {
                throw RestServiceException("Data service name is not defined");
            }

            return getRestService().then(function (restService) {
                var payload = {
                    "keng__id": dataserviceName,
                    "keng__dataPath": "/tko:komodo/tko:workspace/"+dataserviceName,
                    "keng__kType": "Dataservice",
                    "tko__description": dataserviceDescription
                };

                var uri = REST_URI.WORKSPACE + REST_URI.DATA_SERVICES + SYNTAX.FORWARD_SLASH + dataserviceName;
                return restService.all(uri).post(payload);
            });
        };
        
        /**
         * Service: clone a dataservice in the repository
         */
        service.cloneDataService = function (dataserviceName, newDataserviceName) {
            if (!dataserviceName || !newDataserviceName) {
                throw RestServiceException("Data service name or service name for clone are not defined");
            }

            return getRestService().then(function (restService) {
                return restService.all(REST_URI.WORKSPACE + REST_URI.DATA_SERVICES_CLONE + SYNTAX.FORWARD_SLASH + dataserviceName).post(newDataserviceName);
            });
        };

        /**
         * Service: update an existing dataservice in the repository
         */
        service.updateDataService = function (dataserviceName, dataserviceDescription) {
            if (!dataserviceName || !dataserviceDescription) {
                throw RestServiceException("Data service name or description for update are not defined");
            }
            
            return getRestService().then(function (restService) {
                var payload = {
                    "keng__id": dataserviceName,
                    "keng__dataPath": "/tko:komodo/tko:workspace/"+dataserviceName,
                    "keng__kType": "Dataservice",
                    "tko__description": dataserviceDescription
                };

                return restService.all(REST_URI.WORKSPACE + REST_URI.DATA_SERVICES + SYNTAX.FORWARD_SLASH + dataserviceName).customPUT(payload);
            });
        };

        /**
         * Service: delete a data service from the resposiory
         */
        service.deleteDataService = function (dataserviceName) {
            if (!dataserviceName) {
                throw RestServiceException("Data service name for delete is not defined");
            }

            return getRestService().then(function (restService) {

                return restService.one(REST_URI.WORKSPACE + REST_URI.DATA_SERVICES + SYNTAX.FORWARD_SLASH + dataserviceName).remove();
            });
        };

        /**
         * Service: deploy a data service from the resposiory
         */
        service.deployDataService = function (dataserviceName) {
            if (!dataserviceName) {
                throw RestServiceException("Data service name for deploy is not defined");
            }

            return getRestService().then(function (restService) {
                var payload = {
                    "path": "/tko:komodo/tko:workspace/"+dataserviceName
                };

                var uri = REST_URI.TEIID + REST_URI.DATA_SERVICE;
                return restService.all(uri).post(payload);
            });
        };

        /**
         * Service: return the list of data sources.
         * Returns: promise object for the data source collection
         */
        service.getDataSources = function (serviceType) {
            var url = REST_URI.WORKSPACE + REST_URI.DATA_SOURCES;

            if (serviceType === REST_URI.TEIID_SERVICE)
                url = REST_URI.TEIID + REST_URI.DATA_SOURCES;

            return getRestService().then(function (restService) {
                return restService.all(url).getList();
            });
        };

        /**
         * Service: Get a datasource from the repository
         */
        service.getDataSource = function (datasourceName) {
            return getRestService().then(function (restService) {
                if (!datasourceName)
                    return null;

                return restService.one(REST_URI.WORKSPACE + REST_URI.DATA_SOURCES + SYNTAX.FORWARD_SLASH + datasourceName).get();
            });
        };
        
       /**
         * Service: create a new datasource in the repository
         */
        service.createDataSource = function (datasourceName) {
            if (!datasourceName) {
                throw RestServiceException("Data source name is not defined");
            }

            return getRestService().then(function (restService) {
                var payload = {
                    "keng__id": datasourceName,
                    "keng__dataPath": "/tko:komodo/tko:workspace/"+datasourceName,
                    "keng__kType": "Datasource"
                };

                var uri = REST_URI.WORKSPACE + REST_URI.DATA_SOURCES + SYNTAX.FORWARD_SLASH + datasourceName;
                return restService.all(uri).post(payload);
            });
        };
        
        /**
         * Service: clone a datasource in the repository
         */
        service.cloneDataSource = function (datasourceName, newDatasourceName) {
            if (!datasourceName || !newDatasourceName) {
                throw RestServiceException("Data source name or source name for clone are not defined");
            }

            return getRestService().then(function (restService) {
                return restService.all(REST_URI.WORKSPACE + REST_URI.DATA_SOURCES_CLONE + SYNTAX.FORWARD_SLASH + datasourceName).post(newDatasourceName);
            });
        };

        /**
         * Service: update an existing datasource in the repository
         */
        service.updateDataSource = function (datasourceName, datasourceDescription) {
            if (!datasourceName || !datasourceDescription) {
                throw RestServiceException("Data source name or description for update are not defined");
            }
            
            return getRestService().then(function (restService) {
                var payload = {
                    "keng__id": datasourceName,
                    "keng__dataPath": "/tko:komodo/tko:workspace/"+datasourceName,
                    "keng__kType": "Datasource",
                    "tko__description": datasourceDescription
                };

                return restService.all(REST_URI.WORKSPACE + REST_URI.DATA_SOURCES + SYNTAX.FORWARD_SLASH + datasourceName).customPUT(payload);
            });
        };

        /**
         * Service: delete a datasource from the resposiory
         */
        service.deleteDataSource = function (datasourceName) {
            if (!datasourceName) {
                throw RestServiceException("Data source name for delete is not defined");
            }

            return getRestService().then(function (restService) {

                return restService.one(REST_URI.WORKSPACE + REST_URI.DATA_SOURCES + SYNTAX.FORWARD_SLASH + datasourceName).remove();
            });
        };

        /**
         * Service: deploy a datasource from the resposiory
         */
        service.deployDataSource = function (datasourceName) {
            if (!datasourceName) {
                throw RestServiceException("Data source name for deploy is not defined");
            }

            return getRestService().then(function (restService) {
                var payload = {
                    "path": "/tko:komodo/tko:workspace/"+datasourceName
                };

                var uri = REST_URI.TEIID + REST_URI.DATA_SOURCE;
                return restService.all(uri).post(payload);
            });
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

            var vdbType = REST_URI.WORKSPACE;
            if (isTeiidVdb(vdb))
                vdbType = REST_URI.TEIID;

            var link = vdbType + REST_URI.VDBS + SYNTAX.FORWARD_SLASH + vdbId;
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
         * Service: delete a search from the reposiory
         */
        service.deleteSavedSearch = function (searchName) {
            return getRestService().then(function (restService) {
                if (!searchName)
                    return null;

                return restService.one(REST_URI.WORKSPACE + REST_URI.SEARCH + REST_URI.SAVED_SEARCHES +
                    SYNTAX.FORWARD_SLASH + searchName).remove();
            });
        };

        /**
         * Service: get the status of the teiid instance
         */
        service.getTeiidStatus = function() {
            return getRestService().then(function (restService) {
                return restService.one(REST_URI.TEIID + REST_URI.STATUS).get();
            });
        };

        /**
         * Service: get the status of the vdbs on the teiid instance
         */
        service.getTeiidVdbStatus = function() {
            return getRestService().then(function (restService) {
                return restService.one(REST_URI.TEIID + REST_URI.STATUS + REST_URI.VDBS).get();
            });
        };

        /**
         * Service: set the credentials of the default teiid instance
         * body : {
         *              adminUser: 'admin',
         *              adminPasswd: 'admin',
         *              jdbcUser: 'user',
         *              jdbcPasswd: 'user'
         *           }
         */
        service.setTeiidCredentials = function(teiidCredentials) {
            if (!teiidCredentials)
                return null;

            return getRestService().then(function (restService) {
                return restService.all(REST_URI.TEIID + REST_URI.CREDENTIALS).post(teiidCredentials);
            });
        };

        /**
         * Service: query a target deployed on the teiid instance
         */
        service.query = function(query, target, limit, offset) {
            var queryAttributes = {
                query: query,
                target: target,
                limit: limit,
                offset: offset
            };

            return getRestService().then(function (restService) {
                return restService.all(REST_URI.TEIID + REST_URI.QUERY).post(queryAttributes);
            });
        };

        /**
         * Service: ping the teiid instance, either admin or jdbc
         */
        service.ping = function(pingType) {
            if (!pingType)
                return null;

            return getRestService().then(function (restService) {
                return restService.one(REST_URI.TEIID + REST_URI.PING).customGET('', {
                    pingType: pingType
                });
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
