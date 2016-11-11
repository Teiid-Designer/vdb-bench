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
                                             '$http', '$q', '$base64', 'CredentialService'];

    function RepoRestService(CONFIG, SYNTAX, REST_URI, VDB_SCHEMA, VDB_KEYS, RepoSelectionService,
                                            Restangular, $http, $q, $base64, CredentialService) {

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

        function basicAuthHeader(username, password) {
            var authInfo = username + SYNTAX.COLON + password;
            authInfo = $base64.encode(authInfo);
            return "Basic " + authInfo;
        }

        function authHeader(username, password) {
            return {'Authorization': basicAuthHeader(username, password)};
        }

        function httpHeaders(username, password) {
            return { headers: authHeader(username, password) };
        }
        
        function getUserWorkspacePath() {
            return "/tko:komodo/tko:workspace/" + CredentialService.credentials().username;
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
            var user = CredentialService.credentials();

            if (!_.isEmpty(restService)) {
                restService.setDefaultHeaders(authHeader(user.username, user.password));
                //
                // Want to be consistent in the function's return type
                // Promise will resolve immediately upon return.
                //
                return $q.when(restService);
            }

            var testUrl = baseUrl + REST_URI.SERVICE + REST_URI.ABOUT;
            return $http.get(testUrl, httpHeaders(user.username, user.password))
                .then(function (response) {
                    restService = Restangular.withConfig(function (RestangularConfigurer) {
                        RestangularConfigurer.setBaseUrl(baseUrl);
                        RestangularConfigurer.setRestangularFields({
                            selfLink: VDB_KEYS.LINKS + '[0].href'
                        });
                        RestangularConfigurer.setDefaultHeaders(authHeader(user.username, user.password));
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
         * Service: workspace patch
         */
        service.workspacePath = function( ) {
            return getUserWorkspacePath();
        };
        
        /**
         * Service: Simple connection test.
         */
        service.testConnection = function(username, password) {
            var repo = RepoSelectionService.getSelected();
            var baseUrl = url(repo);
            var testUrl = baseUrl + REST_URI.SERVICE + REST_URI.ABOUT;

            return $http.get(testUrl, httpHeaders(username, password))
                            .then(function (response) {
                                return 0;
                            }, function (response) {
                                return 1;
                            });
        };

        /**
         * Service: Try and find the reponse's message and return it
         */
        service.responseMessage = function(response) {
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
         * Service: Get the VDB with specified name from the repo or from teiid
         */
        service.getVdb = function (serviceType, vdbName) {
            var url = REST_URI.WORKSPACE + REST_URI.VDBS;

            if (serviceType === REST_URI.TEIID_SERVICE)
                url = REST_URI.TEIID + REST_URI.VDBS;

            return getRestService().then(function (restService) {
                if (!vdbName)
                    return null;

                return restService.one(url + SYNTAX.FORWARD_SLASH + vdbName).get();
            });
        };

        /**
         * Service: return the list of models in the specified repository VDB
         * Returns: promise object for the VDB Model collection
         */
        service.getVdbModels = function (vdbName) {
            var url = REST_URI.WORKSPACE + REST_URI.VDBS + SYNTAX.FORWARD_SLASH + vdbName + REST_URI.MODELS;

            return getRestService().then(function (restService) {
                return restService.all(url).getList();
            });
        };

        /**
         * Service: return the list of VdbModelSources in the specified repository VDB Model
         * Returns: promise object for the VdbModelSource collection
         */
        service.getVdbModelSources = function (vdbName, modelName) {
            var url = REST_URI.WORKSPACE + REST_URI.VDBS + SYNTAX.FORWARD_SLASH + vdbName + REST_URI.MODELS + SYNTAX.FORWARD_SLASH + modelName + REST_URI.MODEL_SOURCES;

            return getRestService().then(function (restService) {
                return restService.all(url).getList();
            });
        };

        /**
         * Service: sync workspace VDBs from server
         * Returns: promise object for the vdb collection
         */
        /**
         * Service: create a new VDB in the repository
         */
        service.copyServerVdbsToWorkspace = function ( ) {
            return getRestService().then(function (restService) {
                var uri = REST_URI.TEIID + REST_URI.VDBS + SYNTAX.FORWARD_SLASH + REST_URI.VDBS_FROM_TEIID;
                return restService.all(uri).post();
            });
        };
        
        /**
         * Service: updates workspace VDB status from teiid
         */
        service.updateWorkspaceVdbStatusFromTeiid = function ( ) {
            return getRestService().then(function (restService) {
                var uri = REST_URI.TEIID + REST_URI.VDBS + SYNTAX.FORWARD_SLASH + REST_URI.VDBS_FROM_TEIID;
                return restService.all(uri).customPUT();
            });
        };

        /**
         * Service: create a new VDB in the repository
         */
        service.createVdb = function (vdbName, vdbDescription, isSource) {
            if (!vdbName) {
                throw new RestServiceException("VDB name is not defined");
            }

            return getRestService().then(function (restService) {
                var payload = {
                    "keng__id": vdbName,
                    "keng__dataPath": getUserWorkspacePath()+"/"+vdbName,
                    "keng__kType": "Vdb",
                    "vdb__name": vdbName,
                    "vdb__description": vdbDescription,
                    "vdb__originalFile" : getUserWorkspacePath()+"/"+vdbName
                };
                
                // Property added to distinguish service sources
                if (isSource)  {
                    payload.keng__properties = [{ "name": "dsbServiceSource",
                                                  "value": "true"}];
                }

                var uri = REST_URI.WORKSPACE + REST_URI.VDBS + SYNTAX.FORWARD_SLASH + vdbName;
                return restService.all(uri).post(payload);
            });
        };

        /**
         * Service: updates a VDB in the repository
         */
        service.updateVdb = function (vdbName, vdbDescription, isSource) {
            if (!vdbName) {
                throw new RestServiceException("VDB name is not defined");
            }

            return getRestService().then(function (restService) {
                var payload = {
                    "keng__id": vdbName,
                    "keng__dataPath": getUserWorkspacePath()+"/"+vdbName,
                    "keng__kType": "Vdb",
                    "vdb__name": vdbName,
                    "vdb__description": vdbDescription,
                    "vdb__originalFile" : getUserWorkspacePath()+"/"+vdbName
                };
                
                // Property added to distinguish service sources
                if (isSource)  {
                    payload.keng__properties = [{ "name": "dsbServiceSource",
                                                  "value": "true"}];
                }

                var uri = REST_URI.WORKSPACE + REST_URI.VDBS + SYNTAX.FORWARD_SLASH + vdbName;
                return restService.all(uri).customPUT(payload);
            });
        };

        /**
         * Service: create a new VDB in the repository
         */
        service.createVdbModel = function (vdbName, modelName, isSource) {
            if (!vdbName || !modelName) {
                throw new RestServiceException("VDB name or model name is not defined");
            }

            return getRestService().then(function (restService) {
                var payload = {
                    "keng__id": modelName,
                    "keng__dataPath": getUserWorkspacePath()+"/"+vdbName+"/"+modelName,
                    "keng__kType": "Model",
                    "mmcore__modelType": "PHYSICAL"
                };
                
                
                // Adds importer properties for service sources
                if (isSource)  {
                    payload.keng__properties = [{ "name": "importer.TableTypes",
                                                  "value": "TABLE"},
                                                { "name": "importer.UseFullSchemaName",
                                                  "value": "false"},
                                                { "name": "importer.UseQualifiedName",
                                                  "value": "false"},
                                                { "name": "importer.UseCatalogName",
                                                  "value": "false"}];
                }

                var uri = REST_URI.WORKSPACE + REST_URI.VDBS + SYNTAX.FORWARD_SLASH + vdbName + SYNTAX.FORWARD_SLASH + REST_URI.MODELS + SYNTAX.FORWARD_SLASH + modelName;
                return restService.all(uri).post(payload);
            });
        };

        /**
         * Service: create a new VDB in the repository
         */
        service.createVdbModelSource = function (vdbName, modelName, sourceName, transName, jndiName) {
            if (!vdbName || !modelName || !sourceName) {
                throw new RestServiceException("VDB name, modelName or sourceName is not defined");
            }
            if (!transName || !jndiName) {
                throw new RestServiceException("Translator name or JNDI name is not defined");
            }

            return getRestService().then(function (restService) {
                var payload = {
                    "keng__id": sourceName,
                    "keng__dataPath": getUserWorkspacePath()+"/"+vdbName+"/"+modelName+"/vdb:sources/"+sourceName,
                    "keng__kType": "VdbModelSource",
                    "vdb__sourceJndiName": jndiName,
                    "vdb__sourceTranslator": transName
                };

                var uri = REST_URI.WORKSPACE + REST_URI.VDBS + SYNTAX.FORWARD_SLASH + vdbName + 
                          REST_URI.MODELS + SYNTAX.FORWARD_SLASH + modelName + 
                          REST_URI.MODEL_SOURCES + SYNTAX.FORWARD_SLASH + sourceName;
                return restService.all(uri).post(payload);
            });
        };
        
        /**
         * Service: update an existing ModelSource in the repository
         */
        service.updateVdbModelSource = function (vdbName, modelName, sourceName, transName, jndiName) {
            if (!vdbName || !modelName || !sourceName) {
                throw new RestServiceException("VDB name, modelName or sourceName is not defined");
            }
            if (!transName || !jndiName) {
                throw new RestServiceException("Translator name or JNDI name is not defined");
            }
            
            return getRestService().then(function (restService) {
                var payload = {
                        "keng__id": sourceName,
                        "keng__dataPath": getUserWorkspacePath()+"/"+vdbName+"/"+modelName+"/vdb:sources/"+sourceName,
                        "keng__kType": "VdbModelSource",
                        "vdb__sourceJndiName": jndiName,
                        "vdb__sourceTranslator": transName
                    };

                var uri = REST_URI.WORKSPACE + REST_URI.VDBS + SYNTAX.FORWARD_SLASH + vdbName + 
                REST_URI.MODELS + SYNTAX.FORWARD_SLASH + modelName + 
                REST_URI.MODEL_SOURCES + SYNTAX.FORWARD_SLASH + sourceName;
                return restService.all(uri).customPUT(payload);
            });
        };

        /**
         * Service: delete a vdb from the resposiory
         */
        service.deleteVdb = function (vdbName) {
            if (!vdbName) {
                throw new RestServiceException("Vdb name for delete is not defined");
            }

            return getRestService().then(function (restService) {

                return restService.one(REST_URI.WORKSPACE + REST_URI.VDBS + SYNTAX.FORWARD_SLASH + vdbName).remove();
            });
        };

        /**
         * Service: delete the specified model from a repository vdb
         */
        service.deleteVdbModel = function (vdbName, modelName) {
            if (!vdbName || !modelName) {
                throw new RestServiceException("Vdb name or model name for delete is not defined");
            }

            return getRestService().then(function (restService) {

                return restService.one(REST_URI.WORKSPACE + REST_URI.VDBS + SYNTAX.FORWARD_SLASH + vdbName + 
                		               REST_URI.MODELS + SYNTAX.FORWARD_SLASH + modelName).remove();
            });
        };

        /**
         * Service: delete a vdb from the resposiory
         */
        service.deleteTeiidVdb = function (vdbName) {
            if (!vdbName) {
                throw new RestServiceException("Vdb name for delete is not defined");
            }

            return getRestService().then(function (restService) {

                return restService.one(REST_URI.TEIID + REST_URI.VDBS + SYNTAX.FORWARD_SLASH + vdbName).remove();
            });
        };

        /**
         * Service: clone a Vdb in the repository
         */
        service.cloneVdb = function (vdbName, newVdbName) {
            if (!vdbName || !newVdbName) {
                throw new RestServiceException("Vdb name or name for the copy are not defined");
            }

            return getRestService().then(function (restService) {
                return restService.all(REST_URI.WORKSPACE + REST_URI.VDBS_CLONE + SYNTAX.FORWARD_SLASH + vdbName).post(newVdbName);
            });
        };

        /**
         * Service: deploy a vdb from the resposiory
         */
        service.deployVdb = function (vdbName) {
            if (!vdbName) {
                throw new RestServiceException("VDB name for deploy is not defined");
            }
            
            return getRestService().then(function (restService) {
                var payload = {
                    "path": getUserWorkspacePath()+"/"+vdbName
                };

                var uri = REST_URI.TEIID + REST_URI.VDB;
                return restService.all(uri).post(payload);
            });
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
         * Valid formats currently implemented
         */
        service.validDocumentTypes = {
            ZIP: 'zip',
            VDB: '-vdb.xml',
            TDS: 'tds',
            DDL: 'ddl',
            JAR: 'jar'
        };

        /**
         * Service: Determine the document type from the given file name
         * Returns: the document type for the file or null if not recognised
         */
        service.documentType = function(fileName) {

            var documentType = null;
            for (var key in service.validDocumentTypes) {
                var suffix = service.validDocumentTypes[key];
                if (fileName.endsWith(suffix)) {
                    documentType = suffix;
                    break;
                }
            }

            return documentType;
        };

        /**
         * Service: Import the given file
         * Returns: promise object for the imported item
         */
        service.import = function(storageType, artifactPath, parameters, documentType, data) {
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

                // Add artfactPath if supplied
                if (angular.isDefined(artifactPath))  {
                    payload.dataPath = artifactPath;
                }

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
        service.upload = function(documentType, artifactPath, parameters, data) {
            if (!documentType)
                return null;

            return service.import('file', artifactPath, parameters, documentType, data);
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
         * Service: return the list of tables in a vdb model
         * Returns: promise object for the table collection
         */
        service.getVdbModelTables = function (vdbName, modelName) {
            var url = REST_URI.WORKSPACE + REST_URI.VDBS + SYNTAX.FORWARD_SLASH + vdbName + 
                      REST_URI.MODELS + SYNTAX.FORWARD_SLASH + modelName + SYNTAX.FORWARD_SLASH + REST_URI.TABLES;

            return getRestService().then(function (restService) {
                return restService.all(url).getList();
            });
        };

        /**
         * Service: return the list of columns in a vdb model table
         * Returns: promise object for the column collection
         */
        service.getVdbModelTableColumns = function (vdbName, modelName, tableName) {
            var url = REST_URI.WORKSPACE + REST_URI.VDBS + SYNTAX.FORWARD_SLASH + vdbName + 
                      REST_URI.MODELS + SYNTAX.FORWARD_SLASH + modelName + SYNTAX.FORWARD_SLASH +
                      REST_URI.TABLES + SYNTAX.FORWARD_SLASH + tableName + SYNTAX.FORWARD_SLASH + REST_URI.COLUMNS;

            return getRestService().then(function (restService) {
                return restService.all(url).getList();
            });
        };

        /**
         * Service: Creates/Updates a VDB Model using DDL from the supplied teiid VDB Model
         */
        service.updateVdbModelFromDdl = function (vdbName, modelName, teiidVdbName, teiidModelName) {
            if (!vdbName || !modelName || !teiidVdbName || !teiidModelName) {
                throw RestServiceException("VDB update inputs are not defined");
            }
            
            return getRestService().then(function (restService) {
                var payload = {
                    "vdbName": vdbName,
                    "modelName": modelName,
                    "teiidVdbName": teiidVdbName,
                    "teiidModelName": teiidModelName
                };
                
                var uri = REST_URI.TEIID + REST_URI.VDBS + SYNTAX.FORWARD_SLASH + REST_URI.MODEL_FROM_TEIID_DDL;
                return restService.all(uri).post(payload);
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
                throw new RestServiceException("Data service name is not defined");
            }

            return getRestService().then(function (restService) {
                var payload = {
                    "keng__id": dataserviceName,
                    "keng__dataPath": getUserWorkspacePath()+"/"+dataserviceName,
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
                throw new RestServiceException("Data service name or service name for clone are not defined");
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
                throw new RestServiceException("Data service name or description for update are not defined");
            }
            
            return getRestService().then(function (restService) {
                var payload = {
                    "keng__id": dataserviceName,
                    "keng__dataPath": getUserWorkspacePath()+"/"+dataserviceName,
                    "keng__kType": "Dataservice",
                    "tko__description": dataserviceDescription
                };

                return restService.all(REST_URI.WORKSPACE + REST_URI.DATA_SERVICES + SYNTAX.FORWARD_SLASH + dataserviceName).customPUT(payload);
            });
        };

        /**
         * Service: Sets the DataService's service VDB using a single table source.
         * update an existing dataservice in the repository
         */
        service.setDataServiceVdbForSingleTable = function (dataserviceName, viewTablePath, modelSourcePath) {
            if (!dataserviceName || !viewTablePath || !modelSourcePath) {
                throw RestServiceException("Data service update inputs are not defined");
            }
            
            return getRestService().then(function (restService) {
                var payload = {
                    "dataserviceName": dataserviceName,
                    "viewTablePath": getUserWorkspacePath()+"/"+viewTablePath,
                    "modelSourcePath": getUserWorkspacePath()+"/"+modelSourcePath
                };

                return restService.all(REST_URI.WORKSPACE + REST_URI.DATA_SERVICES + SYNTAX.FORWARD_SLASH + REST_URI.SERVICE_VDB_FOR_SINGLE_TABLE).post(payload);
            });
        };

        /**
         * Service: delete a data service from the resposiory
         */
        service.deleteDataService = function (dataserviceName) {
            if (!dataserviceName) {
                throw new RestServiceException("Data service name for delete is not defined");
            }

            return getRestService().then(function (restService) {

                return restService.one(REST_URI.WORKSPACE + REST_URI.DATA_SERVICES + SYNTAX.FORWARD_SLASH + dataserviceName).remove();
            });
        };

        /**
         * Service: Gets the workspace source VDB matches for a DataService's sources.
         */
        service.getWkspSourceVdbsForDataService = function (dataserviceName) {
            return getRestService().then(function (restService) {
                if (!dataserviceName) {
                    throw RestServiceException("Data service name is not defined");
                }

                var uri = REST_URI.WORKSPACE + REST_URI.DATA_SERVICES + SYNTAX.FORWARD_SLASH + dataserviceName + SYNTAX.FORWARD_SLASH + REST_URI.SOURCE_VDB_MATCHES;
                return restService.one(uri).get();
            });
        };

        /**
         * Service: Gets the service view tableNames for a DataService's view.
         */
        service.getTableNamesForDataService = function (dataserviceName) {
            return getRestService().then(function (restService) {
                if (!dataserviceName) {
                    throw RestServiceException("Data service name is not defined");
                }

                var uri = REST_URI.WORKSPACE + REST_URI.DATA_SERVICES + SYNTAX.FORWARD_SLASH + dataserviceName + SYNTAX.FORWARD_SLASH + REST_URI.SERVICE_VIEW_TABLES;
                return restService.one(uri).get();
            });
        };

        /**
         * Service: deploy a data service from the resposiory
         */
        service.deployDataService = function (dataserviceName) {
            if (!dataserviceName) {
                throw new RestServiceException("Data service name for deploy is not defined");
            }

            var dataservicePath = getUserWorkspacePath() + "/" +dataserviceName;
            
            return getRestService().then(function (restService) {
                var payload = {
                    "path" : dataservicePath
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
            if (!serviceType) {
                throw new RestServiceException("DataSource serviceType not specified");
            }

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
         * Service: Get schema for a deployed teiid VDB model
         */
        service.getTeiidVdbModelSchema = function (vdbName, modelName) {
            if(!vdbName || !modelName) {
                throw new RestServiceException("VdbName or ModelName not specified");
            }
            return getRestService().then(function (restService) {
                var url = REST_URI.TEIID + REST_URI.VDBS + SYNTAX.FORWARD_SLASH + vdbName + REST_URI.MODELS + SYNTAX.FORWARD_SLASH + modelName + REST_URI.SCHEMA;

                return restService.one(url).get();
            });
        };
        
       /**
         * Service: create a new datasource in the repository
         */
        service.createDataSource = function (datasourceName, jndiName, driverName) {
            if (!datasourceName || !driverName || !jndiName) {
                throw new RestServiceException("Data source name, jndiName or driverName is not defined");
            }

            return getRestService().then(function (restService) {
                var payload = {
                    "keng__id": datasourceName,
                    "keng__dataPath": getUserWorkspacePath()+"/"+datasourceName,
                    "keng__kType": "Datasource",
                    "driverName": driverName,
                    "jndiName": jndiName
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
                throw new RestServiceException("Data source name or source name for clone are not defined");
            }

            return getRestService().then(function (restService) {
                var link = REST_URI.WORKSPACE + REST_URI.DATA_SOURCES_CLONE + SYNTAX.FORWARD_SLASH + datasourceName;
                return restService.all(REST_URI.WORKSPACE + REST_URI.DATA_SOURCES_CLONE + SYNTAX.FORWARD_SLASH + datasourceName).post(newDatasourceName);
            });
        };

       /**
         * Service: update an existing datasource in the repository
         */
        service.updateDataSource = function (datasourceName, jsonPayload) {
            if (!datasourceName || !jsonPayload) {
                throw new RestServiceException("One of the inputs for update are not defined");
            }
            
            return getRestService().then(function (restService) {
                return restService.all(REST_URI.WORKSPACE + REST_URI.DATA_SOURCES + SYNTAX.FORWARD_SLASH + datasourceName).customPUT(jsonPayload);
            });
        };

        /**
         * Service: delete a datasource from the resposiory
         */
        service.deleteDataSource = function (datasourceName) {
            if (!datasourceName) {
                throw new RestServiceException("Data source name for delete is not defined");
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
                throw new RestServiceException("Data source name for deploy is not defined");
            }

            return getRestService().then(function (restService) {
                var payload = {
                    "path": getUserWorkspacePath()+"/"+datasourceName
                };

                var uri = REST_URI.TEIID + REST_URI.DATA_SOURCE;
                return restService.all(uri).post(payload);
            });
        };

        /**
         * Service: return the list of drivers.
         * Returns: promise object for the driver collection
         */
        service.getDrivers = function (serviceType) {
            if (!serviceType) {
                throw new RestServiceException("Driver serviceType not specified");
            }

            var url = REST_URI.WORKSPACE + REST_URI.DRIVERS;

            if (serviceType === REST_URI.TEIID_SERVICE)
                url = REST_URI.TEIID + REST_URI.DRIVERS;

            return getRestService().then(function (restService) {
                return restService.all(url).getList();
            });
        };

        /**
         * Service: deploy a driver from the resposiory
         */
        service.deployDriver = function (driverName) {
            if (!driverName) {
                throw new RestServiceException("Driver name for deploy is not defined");
            }

            return getRestService().then(function (restService) {
                var payload = {
                    "path": getUserWorkspacePath()+"/"+driverName
                };

                var uri = REST_URI.TEIID + REST_URI.DRIVER;
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
         * Service: get the default translator for a teiid connection
         */
        service.getDefaultTranslatorForConnection = function(connectionName) {
            return getRestService().then(function (restService) {
                var url = REST_URI.TEIID + REST_URI.DATA_SOURCES + SYNTAX.FORWARD_SLASH + connectionName + REST_URI.TRANSLATOR_DEFAULT;
                return restService.one(url).get();
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
