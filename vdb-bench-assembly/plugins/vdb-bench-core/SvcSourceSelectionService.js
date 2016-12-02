/**
 * SvcSourceSelectionService
 *
 * Provides simple API for managing service source vdbs
 */
(function () {

    'use strict';

    angular
        .module('vdb-bench.core')
        .factory('SvcSourceSelectionService', SvcSourceSelectionService);

    SvcSourceSelectionService.$inject = ['$rootScope', 'SYNTAX', 'REST_URI', 'VDB_KEYS', 
                                         'RepoRestService', 'ConnectionSelectionService', 'TranslatorSelectionService', 'DownloadService'];

    function SvcSourceSelectionService($rootScope, SYNTAX, REST_URI, VDB_KEYS, 
                                        RepoRestService, ConnectionSelectionService, TranslatorSelectionService, DownloadService) {

        var svcSrc = {};
        svcSrc.loading = false;
        svcSrc.serviceSources = [];
        svcSrc.serviceSource = null;
        svcSrc.deploymentInProgress = false;
        svcSrc.deploymentServiceName = null;
        svcSrc.deploymentSuccess = false;
        svcSrc.deploymentMessage = null;
        svcSrc.editSourceConnectionNameSelection = null;
        svcSrc.editSourceConnectionJndiSelection = null;
        svcSrc.editSourceTranslatorNameSelection = null;
        svcSrc.editSourceInfo = [];

        /*
         * Service instance to be returned
         */
        var service = {};
        
        function setLoading(loading) {
            svcSrc.loading = loading;

            // Broadcast the loading value for any interested clients
            $rootScope.$broadcast("loadingServiceSourcesChanged", svcSrc.loading);
        }
        
        /**
         * Inits the list of dataService sources
         */
        function initServiceSources(pageId) {
            setLoading(true);
            initVdbs(pageId);

            // Removes any outdated serviceSource
            service.selectServiceSource(null);
        }

        function contains(a, obj) {
            for (var i = 0; i < a.length; i++) {
                if (a[i] === obj) {
                    return true;
                }
            }
            return false;
        }

        /**
         * Initialize the workspace VDBs
         * 1) copys any server VDBs into repo that do not exist
         * 2) sets the vdb status
         */
        function initVdbs(pageId) {
            svcSrc.serviceSources = [];
             try {
                RepoRestService.copyServerVdbsToWorkspace( ).then(
                    // Get workspace VDBs
                    function (result) {
                        updateVdbStatusProperties(pageId);
                    },
                    function (response) {
                        throw RepoRestService.newRestException("Failed to sync workspace VDBs with server.\n" + response.message);
                    });
            } catch (error) {
                alert("An exception occurred:\n" + error.message);
            }
        }
        
        /**
         * Fetch the VDBs from the workspace
         */
        function initWorkspaceVdbs(pageId) {
            try {
                RepoRestService.getVdbs(REST_URI.WKSP_SERVICE).then(
                    // Get workspace VDBs
                    function (wkspVdbs) {
                        // only include 'serviceSource' vdbs
                        var filteredWkspVdbs = getSourceVdbs(wkspVdbs);
                        RepoRestService.copy(filteredWkspVdbs, svcSrc.serviceSources);

                        setLoading(false);
                        if(pageId) {
                            // Broadcast the pageChange
                            $rootScope.$broadcast("dataServicePageChanged", pageId);
                        }
                    },
                    function (response) {
                        // Some kind of error has occurred
                        svcSrc.serviceSources = [];
                        setLoading(false);
                        throw RepoRestService.newRestException("Failed to load workspace vdbs from the host services.\n" + response.message);
                    });
            } catch (error) {
                svcSrc.serviceSources = [];
                setLoading(false);
                alert("An exception occurred:\n" + error.message);
            }
        }
        
        /**
         * Updates the Workspace VDB status based on teiid deployments
         */
        function updateVdbStatusProperties(pageId) {
            try {
                RepoRestService.updateWorkspaceVdbStatusFromTeiid().then(
                    function (result) {
                        // After status update, get the workspace service source VDBs
                        initWorkspaceVdbs(pageId);
                    },
                    function (response) {
                        // Some kind of error has occurred
                        svcSrc.serviceSources = [];
                        throw RepoRestService.newRestException("Failed to load server vdbs from the host services.\n" + response.message);
                    });
            } catch (error) {
                svcSrc.serviceSources = [];
                alert("An exception occurred:\n" + error.message);
            }
        }

        /**
         * Return only vdbs that have source property
         */
        function getSourceVdbs(allVdbs) {
            var sourceVdbs = [];
            if( typeof allVdbs != "undefined" ) {
                for(var i=0; i<allVdbs.length; i++) {
                    if((typeof allVdbs[i].keng__properties === "undefined") || allVdbs[i].keng__properties.length===0) {
                        continue;
                    } else {
                        var isSource = false;
                        var srcTranslatorName = null;
                        for(var key in allVdbs[i].keng__properties) {
                            var test = allVdbs[i].keng__properties[key].name;
                            var value = allVdbs[i].keng__properties[key].value;
                            if(test=='dsbServiceSource' && value=='true') {
                                isSource = true;
                            }
                            if(test=='dsbSourceTranslator') {
                               srcTranslatorName = value;
                            }
                        }
                        if(isSource) {
                            addTranslatorImageLink(allVdbs[i], srcTranslatorName);
                            sourceVdbs.push(allVdbs[i]);
                        }
                    }
                }
            }
            return sourceVdbs;
        }

        function addTranslatorImageLink(vdb, srcTranslatorName) {
            var imageLink = TranslatorSelectionService.getImageLink(srcTranslatorName);
            // Use image link found in map.  If not found, use transparent image.
            if(imageLink !== null) {
                vdb.keng__properties.push({ 
                    "name" : "dsbTranslatorImageLink",
                    "value": imageLink
                });
            } else {
                vdb.keng__properties.push({ 
                    "name" : "dsbTranslatorImageLink",
                    "value": "plugins/vdb-bench-core/content/img/Transparent_70x40.png"
                });
            }
        }

        /*
         * determine if the supplied vdb exists on the server
         */
        service.setLoading = function(isLoading) {
            setLoading(isLoading);
        };

        /*
         * Are the service sources currently loading
         */
        service.isLoading = function() {
            return svcSrc.loading;
        };

        /*
         * Is the service source's deployment flag set
         */
        service.isDeploying = function() {
            return svcSrc.deploymentInProgress;
        };
        
        /*
         * Returns deployment service source name
         */
        service.deploymentSvcSourceName = function() {
            return svcSrc.deploymentSvcSourceName;
        };
        
        /*
         * Returns service source deployment success state
         */
        service.deploymentSuccess = function() {
            return svcSrc.deploymentSuccess;
        };
        
        /*
         * Returns service source deployment message
         */
        service.deploymentMessage = function() {
            return svcSrc.deploymentMessage;
        };

        /*
         * Set the deployment flag
         */
        service.setDeploying = function(deploying, svcSourceName, deploymentSuccess, message) {
            svcSrc.deploymentInProgress = deploying;
            svcSrc.deploymentSvcSourceName = svcSourceName;
            svcSrc.deploymentSuccess = deploymentSuccess;
            svcSrc.deploymentMessage = message;

            $rootScope.$broadcast("deployServiceSourceChanged", svcSrc.deploymentInProgress);
        };

        /*
         * Select the given serviceSource
         */
        service.getServiceSources = function() {
            return svcSrc.serviceSources;
        };

        /*
         * Select the given serviceSource
         */
        service.selectServiceSource = function(serviceSource) {
            //
            // Set the selected serviceSource
            //
            svcSrc.serviceSource = serviceSource;
            $rootScope.$broadcast("selectedServiceSourceChanged", svcSrc.serviceSource);
        };

        /*
         * return selected serviceSource
         */
        service.selectedServiceSource = function() {
            return svcSrc.serviceSource;
        };

        /*
         * Set info about the service source being edited.
         * [connectionName :
         */
        service.setEditSourceInfo = function(sourceInfo) {
            svcSrc.editSourceInfo = sourceInfo;
        };

        /*
         * Returns the info about the service source being edited.
         */
        service.getEditSourceInfo = function() {
            return svcSrc.editSourceInfo;
        };

        /*
         * return selected serviceSource vdb model
         */
        service.selectedServiceSourceModel = function(onSuccessCallback, onFailureCallback) {
            if(_.isEmpty(svcSrc.serviceSource)) {
                onFailureCallback("No source selected");
                return;
            }

            if(_.isEmpty(svcSrc.serviceSource.keng__dataPath)) {
                onFailureCallback("Selected source does not contain a workspace path");
                return;
            }

            // Update the selected source modelName and TranslatorName - only if its in local workspace
            if (svcSrc.serviceSource.keng__dataPath.indexOf("tko:workspace") < 0) {
                onFailureCallback("Selected source is not in the workspace");
                return;
            }

            try {
                RepoRestService.getVdbModels(svcSrc.serviceSource.keng__id).then(
                    function (models) {
                        if (_.isEmpty(models) || models.length === 0) {
                            onFailureCallback("Failed getting VDB Connection name.\nThe source model is not available");
                            return;
                        }

                        onSuccessCallback(models[0]);
                    },
                    function (response) {
                        onFailureCallback("Failed getting VDB Connection name.\n" + RepoRestService.responseMessage(response));
                    });
            } catch (error) {
                onFailureCallback("An exception occurred:\n" + error.message);
            }
        };

        /*
         * return selected serviceSource ModelSource
         */
        service.selectedServiceSourceModelSource = function(onSuccessCallback, onFailureCallback) {

            var srcModelCallback = function(model) {
                RepoRestService.getVdbModelSources(svcSrc.serviceSource.keng__id, model.keng__id).then(
                    function (modelSources) {
                        if (_.isEmpty(modelSources) || modelSources.length === 0) {
                            onFailureCallback("Failed getting VDB Translator name.\nThe service source model source is not available");
                            return;
                        }

                        onSuccessCallback(modelSources[0]);
                    },
                    function (response) {
                        onFailureCallback("Failed getting VDB Translator name.\n" + RepoRestService.responseMessage(response));
                    });
            };

            service.selectedServiceSourceModel(srcModelCallback, onFailureCallback);
        };

        /*
         * return selected serviceSource
         */
        service.hasSelectedServiceSource = function() {
            if (! angular.isDefined(svcSrc.serviceSource))
                return false;

            if (_.isEmpty(svcSrc.serviceSource))
                return false;

            if (svcSrc.serviceSource === null)
                return false;

            return true;
        };
        
        /*
         * Refresh the collection of service sources
         */
        service.refresh = function(pageId) {
            initServiceSources(pageId);
        };

        /**
         * Refresh Connections and Translators
         */
        service.refreshConnectionsAndTranslators = function() {
            ConnectionSelectionService.refresh();
            TranslatorSelectionService.refresh();
        };

        // Initialise service source collection on loading
        service.refresh();
        
        return service;
    }

})();
