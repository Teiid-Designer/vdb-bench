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
                                             '$http', '$q', '$base64', 'CredentialService', '$interval',
                                             '$location', '$translate', 'KCService'];

    function RepoRestService(CONFIG, SYNTAX, REST_URI, VDB_SCHEMA, VDB_KEYS, RepoSelectionService,
                                            Restangular, $http, $q, $base64, CredentialService, $interval, $location, $translate, KCService) {

        /*
         * Service instance to be returned
         */
        var service = {};

        // Restangular services keyed by host:port/baseUrl
        service.cachedServices = {};

        function url(repo) {
            return CONFIG.rest.protocol +
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

        function RequiredRoleException(role) {
            this.role = role;
            this.message = "User lacks the required '" + role + "' role";
            this.toString = function () {
                return this.message;
            };
        }
        RequiredRoleException.prototype = new Error();
        RequiredRoleException.prototype.constructor = RequiredRoleException;

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

        function kcAuthHeader() {
            if (! KCService.isAuthenticated())
                return;

            if (! KCService.hasToken())
                return;

            return "Bearer " + KCService.token();
        }

        function authHeader(repo) {
            if (angular.isUndefined(repo) || _.isEmpty(repo.authType))
                return {};

            var headers = {};
            if (CredentialService.isBasicAuth(repo)) {
                var credentials = CredentialService.credentials();
                headers[CONFIG.http.authHeader] = basicAuthHeader(credentials.username, credentials.password);
            }
            else if (CredentialService.isKCAuth(repo)) {
                headers[CONFIG.http.authHeader] = kcAuthHeader();
            }

            return headers;
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

            if (!_.isEmpty(restService)) {
                restService.setDefaultHeaders(authHeader(repo));
                //
                // Want to be consistent in the function's return type
                // Promise will resolve immediately upon return.
                //
                return $q.when(restService);
            }

            var testUrl = baseUrl + REST_URI.SERVICE + REST_URI.ABOUT;
            var httpHeaders = {
                headers: authHeader(repo)
            };

            return $http.get(testUrl, httpHeaders)
                .then(function (response) {
                    restService = Restangular.withConfig(function (RestangularConfigurer) {
                        RestangularConfigurer.setBaseUrl(baseUrl);
                        RestangularConfigurer.setRestangularFields({
                            selfLink: VDB_KEYS.LINKS + '[0].href'
                        });
                        RestangularConfigurer.setDefaultHeaders(authHeader(repo));
                    });

                service.cachedServices[baseUrl] = restService;
                return restService;

            }, function (response) {
                // called asynchronously if an error occurs
                // or server returns response with an error status.
                throw new HostNotReachableException(baseUrl, 'Status code: ' + response.status);
            });
        }

        function noRoleError(role) {
            throw new RequiredRoleException(role);
        }

        function noRoleReturnEarly(role) {
            var result = {
                "error": "User lacks the required '" + role + "'role"
            };

            return $q.when(result);
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
        service.testConnection = function() {
            var repo = RepoSelectionService.getSelected();
            var baseUrl = url(repo);
            var testUrl = baseUrl + REST_URI.SERVICE + REST_URI.ABOUT;

            var config = {};
            config.headers = {};
            if (CredentialService.isBasicAuth()) {
                var username = CredentialService.credential(CONFIG.basic.username);
                var password = CredentialService.credential(CONFIG.basic.password);
                config.headers[CONFIG.http.authHeader] = basicAuthHeader(username, password);
            } else if (CredentialService.isKCAuth()){
                config.headers[CONFIG.http.authHeader] = kcAuthHeader();
            }

            return $http.get(testUrl, config)
                    .then(function (response) {
                        return {
                            status: 0
                        };
                    }, function (response) {
                        return {
                            status: 1
                        };
                    });
        };

        function isXML(xml){
            try {
                var xmlDoc = $.parseXML(xml); //is valid XML
                return true;
            } catch (err) {
                // was not XML
                return false;
            }
        }

        function tryJsonParse (jsonString){
            try {
                var o = JSON.parse(jsonString);

                // Handle non-exception-throwing cases:
                // Neither JSON.parse(false) or JSON.parse(1234) throw errors, hence the type-checking,
                // but... JSON.parse(null) returns null, and typeof null === "object",
                // so we must check for that, too. Thankfully, null is falsey, so this suffices:
                if (o && typeof o === "object") {
                    return o;
                }
            } catch (e) {}

            return null;
        }

        function tryNumberParse(jsonString) {
            try {
                var n = parseInt(jsonString);
                if (n && typeof n === "number") {
                    return n;
                }
            } catch (e) {}

            return null;
        }

        /**
         * Service: get the about information of the application
         */
        service.getAbout = function() {
            return getRestService().then(function (restService) {
                return restService.one(REST_URI.SERVICE + REST_URI.ABOUT).get();
            });
        };

        /**
         * Service: Simple connection test.
         */
        service.odataGet = function(url) {
            if (! CredentialService.canOdataTest())
                noRoleError(CONFIG.keycloak.odataRole);

            var user = CredentialService.credentials();
            var repo = RepoSelectionService.getSelected();
            return $http.get(
                            url,
                            {
                                headers: authHeader(repo),
                                transformResponse:function(data) {
                                    var jobj = tryJsonParse(data);
                                    if (_.isObject(jobj)) {
                                        return jobj;
                                    } else if (isXML(data)) {
                                        // convert the data to JSON and provide
                                        // it to the success function below
                                        var x2js = new X2JS();
                                        var json = x2js.xml_str2json( data );
                                        return json;
                                    }

                                    var n = tryNumberParse(data);
                                    if (n) {
                                        return {
                                            count: n
                                        };
                                    }

                                    if (typeof data === 'string' || data instanceof String) {
                                        return {
                                            value: data
                                        };
                                    }

                                    return {
                                        error: 'Error: Request to ' + url + " produces an unexpected response: " + data
                                    };
                                }
                            }
                        ).then(function (response) {
                            // this callback will be called asynchronously
                            // when the response is available
                            if (response.data && response.data.error) {
                                return {
                                    status: 500,
                                    error: response.data.error
                                };
                            }

                            return response;

                        }, function (response) {
                            // called asynchronously if an error occurs
                            // or server returns response with an error status.

                            var errorMsg = response.statusText;
                            if (response.data && response.data.error && response.data.error.message) {
                                errorMsg = errorMsg + SYNTAX.COLON + SYNTAX.SPACE + response.data.error.message;
                            }

                            return {
                                status: response.status,
                                error: errorMsg
                            };
                        });
        };

        /**
         * Service: Try and find the reponse's message and return it
         */
        service.responseMessage = function(response) {
            var msg = "";

            if (response.message)
                msg = response.message;
            else if (response.data && response.data.error)
                msg = response.data.error;
            else if (response.status && response.statusText)
                msg = response.status + SYNTAX.COLON + response.statusText;

            if ( response.config.url ) {
                var url = decodeURIComponent( response.config.url );

                if ( _.isEmpty( msg ) ) {
                    return $translate.instant( 'RepositoryRestService.unknownErrorWithUrl',
                                               { url: url } );
                }

                return $translate.instant( 'RepositoryRestService.errorWithUrl',
                                           { url: url, error: msg } );
            }

            if ( _.isEmpty( msg ) ) {
                return $translate.instant( 'RepositoryRestService.unknownError' );
            }

            return msg;
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
         * Service: return the list of table names for the jdbc connection
         */
        service.getJdbcConnectionTables = function (catalogFilter, schemaFilter, tableFilter, connectionName) {
            if (! CredentialService.canEdit())
                noRoleError(CONFIG.keycloak.repoEditorRole);

            var url = REST_URI.TEIID + REST_URI.CONNECTIONS + REST_URI.TABLES;
            var catFilter = "";
            var schFilter = "";
            var tblFilter = "%";
            if(catalogFilter !== null) {
                catFilter = catalogFilter;
            }
            if(schemaFilter !== null) {
                schFilter = schemaFilter;
            }
            if(tableFilter !== null) {
                tblFilter = tableFilter;
            }
            var jdbcTableAttributes = {
                dataSourceName: connectionName,
                catalogFilter: catFilter,
                schemaFilter: schFilter,
                tableFilter: tblFilter
            };

            return getRestService().then(function (restService) {
                return restService.all(url).post(jdbcTableAttributes);
            });

        };

        /**
         * Service: return the catalog and schema info for the jdbc connection
         */
        service.getJdbcConnectionCatalogSchemaInfo = function (connectionName) {
            var url = REST_URI.TEIID + REST_URI.CONNECTIONS + SYNTAX.FORWARD_SLASH + connectionName + REST_URI.JDBC_CATALOG_SCHEMA;

            return getRestService().then(function (restService) {
                return restService.one(url).get();
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
            if (! CredentialService.canEdit())
                return noRoleReturnEarly(CONFIG.keycloak.repoEditorRole);

            return getRestService().then(function (restService) {
                var uri = REST_URI.TEIID + REST_URI.VDBS + SYNTAX.FORWARD_SLASH + REST_URI.VDBS_FROM_TEIID;
                return restService.all(uri).post();
            });
        };

        /**
         * Service: updates workspace VDB status from teiid
         */
        service.updateWorkspaceVdbStatusFromTeiid = function ( ) {
            if (! CredentialService.canEdit())
                return noRoleReturnEarly(CONFIG.keycloak.repoEditorRole);

            return getRestService().then(function (restService) {
                var uri = REST_URI.TEIID + REST_URI.VDBS + SYNTAX.FORWARD_SLASH + REST_URI.VDBS_FROM_TEIID;
                return restService.all(uri).customPUT();
            });
        };

        /**
         * Service: create a new VDB in the repository
         */
        service.createVdb = function (vdbName, vdbDescription, isSource) {
            if (! CredentialService.canEdit())
                noRoleError(CONFIG.keycloak.repoEditorRole);

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
            if (! CredentialService.canEdit())
                noRoleError(CONFIG.keycloak.repoEditorRole);

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
        service.createVdbModel = function (vdbName, modelName, isSource, importerProperties) {
            if (! CredentialService.canEdit())
                noRoleError(CONFIG.keycloak.repoEditorRole);

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
                if (isSource && angular.isDefined(importerProperties))  {
                    payload.keng__properties = importerProperties;
                }

                var uri = REST_URI.WORKSPACE + REST_URI.VDBS + SYNTAX.FORWARD_SLASH + vdbName +
                          SYNTAX.FORWARD_SLASH + REST_URI.MODELS + SYNTAX.FORWARD_SLASH + modelName;
                return restService.all(uri).post(payload);
            });
        };

        /**
         * Service: create a new VDB in the repository
         */
        service.updateVdbModel = function (vdbName, modelName, isSource, importerProperties, modelDdl) {
            if (! CredentialService.canEdit())
                noRoleError(CONFIG.keycloak.repoEditorRole);

            if (!vdbName || !modelName) {
                throw new RestServiceException("VDB name or model name is not defined");
            }

            return getRestService().then(function (restService) {
                var payload = {
                    "keng__id": modelName,
                    "keng__dataPath": getUserWorkspacePath()+"/"+vdbName+"/"+modelName,
                    "keng__kType": "Model",
                    "mmcore__modelType": "PHYSICAL",
                    "keng__ddl": modelDdl
                };


                // Adds importer properties for service sources
                if ( isSource && angular.isDefined(importerProperties) && importerProperties.length > 0 )  {
                    payload.keng__properties = importerProperties;
                }

                var uri = REST_URI.WORKSPACE + REST_URI.VDBS + SYNTAX.FORWARD_SLASH + vdbName +
                          SYNTAX.FORWARD_SLASH + REST_URI.MODELS + SYNTAX.FORWARD_SLASH + modelName;
                return restService.all(uri).customPUT(payload);
            });
        };

        /**
         * Service: create a new VDB in the repository
         */
        service.createVdbModelSource = function (vdbName, modelName, sourceName, transName, jndiName) {
            if (! CredentialService.canEdit())
                noRoleError(CONFIG.keycloak.repoEditorRole);

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
            if (! CredentialService.canEdit())
                noRoleError(CONFIG.keycloak.repoEditorRole);

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
            if (! CredentialService.canEdit())
                noRoleError(CONFIG.keycloak.repoEditorRole);

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
            if (! CredentialService.canEdit())
                noRoleError(CONFIG.keycloak.repoEditorRole);

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
            if (! CredentialService.canEdit())
                noRoleError(CONFIG.keycloak.repoEditorRole);

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
            if (! CredentialService.canEdit())
                noRoleError(CONFIG.keycloak.repoEditorRole);

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
            if (! CredentialService.canEdit())
                noRoleError(CONFIG.keycloak.repoEditorRole);

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
            if (! CredentialService.canEdit())
                noRoleError(CONFIG.keycloak.repoEditorRole);

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
            if (! CredentialService.canEdit())
                noRoleError(CONFIG.keycloak.repoEditorRole);

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
            if (! CredentialService.canEdit())
                noRoleError(CONFIG.keycloak.repoEditorRole);

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
            if (! CredentialService.canEdit())
                noRoleError(CONFIG.keycloak.repoEditorRole);

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
            if (! CredentialService.canEdit())
                noRoleError(CONFIG.keycloak.repoEditorRole);

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
            if (! CredentialService.canEdit())
                noRoleError(CONFIG.keycloak.repoEditorRole);

            if (!dataserviceName) {
                throw new RestServiceException("Data service name for update is not defined");
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
         * update an existing dataservice in the repository.
         * - If non-null viewDDL is supplied, it is used to define the view (overrides other provided args)
         * - null or empty columnNames means "include all columns"
         */
        service.setDataServiceVdbForSingleTable = function (dataserviceName, modelSourcePath, viewDdl, tablePath, columnNames) {
            if (! CredentialService.canEdit())
                noRoleError(CONFIG.keycloak.repoEditorRole);

            if (!dataserviceName || !modelSourcePath || !tablePath) {
                throw RestServiceException("Data service update inputs are not defined");
            }

            return getRestService().then(function (restService) {
                var payload = {
                    "dataserviceName": dataserviceName,
                    "modelSourcePath": getUserWorkspacePath()+"/"+modelSourcePath,
                    "tablePath": getUserWorkspacePath()+"/"+tablePath
                };
                // Adds requested viewDdl if provided
                if ( viewDdl && viewDdl.length>0 )  {
                    payload.viewDdl = viewDdl;
                }
                // Adds requested column names if provided
                if ( columnNames && columnNames.length > 0 )  {
                    payload.columnNames = columnNames;
                }

                return restService.all(REST_URI.WORKSPACE + REST_URI.DATA_SERVICES + SYNTAX.FORWARD_SLASH + REST_URI.SERVICE_VDB_FOR_SINGLE_TABLE).post(payload);
            });
        };

        /**
         * Service: Sets the DataService's service VDB using join tables
         * update an existing dataservice in the repository.
         * If non-null viewDdl is provided - it is used to set the view (overrides other supplied parameters)
         * If null or empty columnNames are provided - means "include all columns"
         */
        service.setDataServiceVdbForJoinTables = function (dataserviceName, modelSourcePath, rhModelSourcePath, viewDdl,
                                                                            tablePath, columnNames,
                                                                            rhTablePath, rhColumnNames,
                                                                            joinType, criteriaPredicates) {
            if (! CredentialService.canEdit())
                noRoleError(CONFIG.keycloak.repoEditorRole);

            if (!dataserviceName || !modelSourcePath || !rhModelSourcePath || !tablePath || !rhTablePath) {
                throw RestServiceException("Data service update inputs are not defined");
            }

            return getRestService().then(function (restService) {
                var payload = {
                    "dataserviceName": dataserviceName,
                    "modelSourcePath": getUserWorkspacePath()+"/"+modelSourcePath,
                    "rhModelSourcePath": getUserWorkspacePath()+"/"+rhModelSourcePath,
                    "tablePath": getUserWorkspacePath()+"/"+tablePath,
                    "rhTablePath": getUserWorkspacePath()+"/"+rhTablePath
                };
                // Adds requested viewDdl if provided
                if ( viewDdl && viewDdl.length > 0 )  {
                    payload.viewDdl = viewDdl;
                }
                // Adds requested column names if provided
                if ( columnNames && columnNames.length > 0 )  {
                    payload.columnNames = columnNames;
                }
                // Adds requested rh column names if provided
                if ( rhColumnNames && rhColumnNames.length > 0 )  {
                    payload.rhColumnNames = rhColumnNames;
                }
                // Adds requested joinType if provided
                if ( joinType && joinType.length > 0 )  {
                    payload.joinType = joinType;
                }
                // Adds criteria predicates if provided
                if ( criteriaPredicates && criteriaPredicates.length > 0 )  {
                    payload.criteriaPredicates = criteriaPredicates;
                }

                return restService.all(REST_URI.WORKSPACE + REST_URI.DATA_SERVICES + SYNTAX.FORWARD_SLASH + REST_URI.SERVICE_VDB_FOR_JOIN_TABLES).post(payload);
            });
        };

        /**
         * Service: Get the DataService View DDL based on the provided info.
         */
        service.getDataServiceViewDdlForSingleTable = function (dataserviceName, tablePath, columnNames) {
            if (! CredentialService.canEdit())
                noRoleError(CONFIG.keycloak.repoEditorRole);

            if (!dataserviceName || !tablePath ) {
                throw RestServiceException("get View DDL inputs are not sufficiently defined");
            }

            return getRestService().then(function (restService) {
                var payload = {
                    "dataserviceName": dataserviceName,
                    "tablePath": getUserWorkspacePath()+"/"+tablePath
                };
                // Adds requested column names if provided
                if ( columnNames && columnNames.length > 0 )  {
                    payload.columnNames = columnNames;
                }

                return restService.all(REST_URI.WORKSPACE + REST_URI.DATA_SERVICES + SYNTAX.FORWARD_SLASH + REST_URI.SERVICE_VIEW_DDL_FOR_SINGLE_TABLE).post(payload);
            });
        };

        /**
         * Service: Get the DataService View DDL based on the provided info.
         */
        service.getDataServiceViewDdlForJoinTables = function (dataserviceName, tablePath, columnNames,
                                                                                rhTablePath, rhColumnNames,
                                                                                joinType, criteriaPredicates ) {

            if (! CredentialService.canEdit())
                noRoleError(CONFIG.keycloak.repoEditorRole);

            if (!dataserviceName || !tablePath || !rhTablePath ) {
                throw RestServiceException("get View DDL inputs are not sufficiently defined");
            }

            return getRestService().then(function (restService) {
                var payload = {
                    "dataserviceName": dataserviceName,
                    "tablePath": getUserWorkspacePath()+"/"+tablePath,
                    "rhTablePath": getUserWorkspacePath()+"/"+rhTablePath
                };
                // Adds joinType if provided
                if ( joinType )  {
                    payload.joinType = joinType;
                }
                // Adds requested column names if provided
                if ( columnNames && columnNames.length > 0 )  {
                    payload.columnNames = columnNames;
                }
                // Adds requested rh column names if provided
                if ( rhColumnNames && rhColumnNames.length > 0 )  {
                    payload.rhColumnNames = rhColumnNames;
                }
                // Adds criteria predicates if provided
                if ( criteriaPredicates && criteriaPredicates.length > 0 )  {
                    payload.criteriaPredicates = criteriaPredicates;
                }

                return restService.all(REST_URI.WORKSPACE + REST_URI.DATA_SERVICES + SYNTAX.FORWARD_SLASH + REST_URI.SERVICE_VIEW_DDL_FOR_JOIN_TABLES).post(payload);
            });
        };

        /**
         * Service: Get the DataService join criteria for the provided tables.
         */
        service.getJoinCriteriaForTables = function (tablePath, rhTablePath ) {
            if (! CredentialService.canEdit())
                noRoleError(CONFIG.keycloak.repoEditorRole);

            if ( !tablePath || !rhTablePath ) {
                throw RestServiceException("getJoinCriteria inputs are not sufficiently defined");
            }

            return getRestService().then(function (restService) {
                var payload = {
                    "tablePath": getUserWorkspacePath()+"/"+tablePath,
                    "rhTablePath": getUserWorkspacePath()+"/"+rhTablePath
                };

                return restService.all(REST_URI.WORKSPACE + REST_URI.DATA_SERVICES + SYNTAX.FORWARD_SLASH + REST_URI.CRITERIA_FOR_JOIN_TABLES).post(payload);
            });
        };

        /**
         * Service: delete a data service from the resposiory
         */
        service.deleteDataService = function (dataserviceName) {
            if (! CredentialService.canEdit())
                noRoleError(CONFIG.keycloak.repoEditorRole);

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
         * Service: Gets info for a DataService's view.
         */
        service.getViewInfoForDataService = function (dataserviceName) {
            return getRestService().then(function (restService) {
                if (!dataserviceName) {
                    throw RestServiceException("Data service name is not defined");
                }

                var uri = REST_URI.WORKSPACE + REST_URI.DATA_SERVICES + SYNTAX.FORWARD_SLASH + dataserviceName + SYNTAX.FORWARD_SLASH + REST_URI.SERVICE_VIEW_INFO;
                return restService.one(uri).get();
            });
        };

        /**
         * Service: deploy a data service from the resposiory
         */
        service.deployDataService = function (dataserviceName) {
            if (! CredentialService.canEdit())
                noRoleError(CONFIG.keycloak.repoEditorRole);

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
         * Service: Poll the teiid server for the point that the vdb becomes active
         * Has a timeout limit of 1 minute.
         */
        service.pollForActiveVdb = function(vdbName, successCallback, failCallback) {

            var promise = $interval(function() {
                service.getTeiidVdbStatus().then(
                    function (status) {
                        if (_.isEmpty(status) || _.isEmpty(status.vdbs))
                            return;

                        for (var i = 0; i < status.vdbs.length; ++i) {
                            var vdb = status.vdbs[i];
                            if (vdbName !== vdb.name)
                                continue;

                            if (vdb.active) {
                                successCallback();
                                $interval.cancel(promise);
                                return;
                            } else if (vdb.failed) {
                                if (failCallback) {
                                    failCallback("Failed");
                                }
                                $interval.cancel(promise);
                            }
                        }
                    },
                    function (response) {
                        if (failCallback)
                            failCallback(service.responseMessage(response));

                        //
                        // Failure to connect the first time means its not
                        // going to connect the remaining 59 times
                        //
                        $interval.cancel(promise);
                    });
            }, 2000, 30); // timeout after 30 iterations (or 60 seconds)
        };

        /**
         * Service: return the list of connections.
         * Returns: promise object for the connection collection
         */
        service.getConnections = function (serviceType) {
            if (!serviceType) {
                throw new RestServiceException("DataSource serviceType not specified");
            }

            var url = REST_URI.WORKSPACE + REST_URI.CONNECTIONS;

            if (serviceType === REST_URI.TEIID_SERVICE)
                url = REST_URI.TEIID + REST_URI.CONNECTIONS;

            return getRestService().then(function (restService) {
                return restService.all(url).getList();
            });
        };

        /**
         * Service: Get a connection from the repository
         */
        service.getConnection = function (connectionName) {
            return getRestService().then(function (restService) {
                if (!connectionName)
                    return null;

                return restService.one(REST_URI.WORKSPACE + REST_URI.CONNECTIONS + SYNTAX.FORWARD_SLASH + connectionName).get();
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
         * Service: create a new connection in the repository
         */
        service.createConnection = function (connectionName, jndiName, driverName) {
            if (! CredentialService.canEdit())
                noRoleError(CONFIG.keycloak.repoEditorRole);

            if (!connectionName || !driverName || !jndiName) {
                throw new RestServiceException("Connection name, jndiName or driverName is not defined");

            }

            return getRestService().then(function (restService) {
                var payload = {
                    "keng__id": connectionName,
                    "keng__dataPath": getUserWorkspacePath()+"/"+connectionName,
                    "keng__kType": "Datasource",
                    "driverName": driverName,
                    "jndiName": jndiName
                };

                var uri = REST_URI.WORKSPACE + REST_URI.CONNECTIONS + SYNTAX.FORWARD_SLASH + connectionName;
                return restService.all(uri).post(payload);
            });
        };

        /**
         * Service: clone a connection in the repository
         */
        service.cloneConnection = function (connectionName, newConnectionName) {
            if (! CredentialService.canEdit())
                noRoleError(CONFIG.keycloak.repoEditorRole);

            if (!connectionName || !newConnectionName) {
                throw new RestServiceException("Connection name or name for clone are not defined");
            }

            return getRestService().then(function (restService) {
                var link = REST_URI.WORKSPACE + REST_URI.CONNECTIONS_CLONE + SYNTAX.FORWARD_SLASH + connectionName;
                return restService.all(REST_URI.WORKSPACE + REST_URI.CONNECTIONS_CLONE + SYNTAX.FORWARD_SLASH + connectionName).post(newConnectionName);
            });
        };

       /**
         * Service: update an existing connection in the repository
         */
        service.updateConnection = function (connectionName, jsonPayload) {
            if (! CredentialService.canEdit())
                noRoleError(CONFIG.keycloak.repoEditorRole);

            if (!connectionName || !jsonPayload) {
                throw new RestServiceException("One of the inputs for update are not defined");
            }

            return getRestService().then(function (restService) {
                return restService.all(REST_URI.WORKSPACE + REST_URI.CONNECTIONS + SYNTAX.FORWARD_SLASH + connectionName).customPUT(jsonPayload);
            });
        };

        /**
         * Service: delete a connection from the resposiory
         */
        service.deleteConnection = function (connectionName) {
            if (! CredentialService.canEdit())
                noRoleError(CONFIG.keycloak.repoEditorRole);

            if (!connectionName) {
                throw new RestServiceException("Connection name for delete is not defined");
            }

            return getRestService().then(function (restService) {

                return restService.one(REST_URI.WORKSPACE + REST_URI.CONNECTIONS + SYNTAX.FORWARD_SLASH + connectionName).remove();
            });
        };

        /**
         * Service: deploy a connection from the resposiory
         */
        service.deployConnection = function (connectionName) {
            if (! CredentialService.canEdit())
                noRoleError(CONFIG.keycloak.repoEditorRole);

            if (!connectionName) {
                throw new RestServiceException("Connection name for deploy is not defined");
            }

            return getRestService().then(function (restService) {
                var payload = {
                    "path": getUserWorkspacePath()+"/"+connectionName
                };

                var uri = REST_URI.TEIID + REST_URI.CONNECTION;
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
            if (! CredentialService.canEdit())
                noRoleError(CONFIG.keycloak.repoEditorRole);

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
            if (! CredentialService.canEdit())
                noRoleError(CONFIG.keycloak.repoEditorRole);

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
            if (! CredentialService.canEdit())
                noRoleError(CONFIG.keycloak.repoEditorRole);

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
            if (! CredentialService.canEdit())
                noRoleError(CONFIG.keycloak.repoEditorRole);

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
                var url = REST_URI.TEIID + REST_URI.CONNECTIONS + SYNTAX.FORWARD_SLASH + connectionName + REST_URI.TRANSLATOR_DEFAULT;
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
            if (! CredentialService.canEdit())
                noRoleError(CONFIG.keycloak.repoEditorRole);

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
            if (! CredentialService.canEdit())
                noRoleError(CONFIG.keycloak.repoEditorRole);

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

        /**
         * Validates the specified data service name. If the name contains valid characters and
         * the name is unique, the service returns 'null'. Otherwise, a 'string' containing an
         * error message is returned.
         */
        service.validateDataServiceName = function( name ) {
            if ( _.isEmpty( name ) ) {
                return $translate.instant( 'RepositoryRestService.emptyDataServiceName' );
            }

            var url = REST_URI.WORKSPACE +
                      REST_URI.DATA_SERVICES +
                      REST_URI.NAME_VALIDATION +
                      SYNTAX.FORWARD_SLASH +
                      name;

            return getRestService().then(
                function( restService ) {
                    return restService.one( url ).get();
                }
            );
        };

        /**
         * Validates the specified data source name. If the name contains valid characters and
         * the name is unique, the service returns 'null'. Otherwise, a 'string' containing an
         * error message is returned.
         */
        service.validateDataSourceName = function( name ) {
            if ( _.isEmpty( name ) ) {
                return $translate.instant( 'RepositoryRestService.emptyDataSoureName' );
            }

            // since data sources are actually VDBs we need to use VDBs URI
            var url = REST_URI.WORKSPACE +
                      REST_URI.VDBS +
                      REST_URI.NAME_VALIDATION +
                      SYNTAX.FORWARD_SLASH +
                      name;

            return getRestService().then(
                function( restService ) {
                    return restService.one( url ).get();
                }
            );
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
