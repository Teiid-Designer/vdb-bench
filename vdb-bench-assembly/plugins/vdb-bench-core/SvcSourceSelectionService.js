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
        svcSrc.teiidVdbs = [];
        svcSrc.teiidVdbNames = [];
        svcSrc.deploymentInProgress = false;
        svcSrc.deploymentServiceName = null;
        svcSrc.deploymentSuccess = false;
        svcSrc.deploymentMessage = null;
        svcSrc.selectedSvcSrcModelName = null;
        svcSrc.selectedSvcSrcTranslatorName = null;

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
            svcSrc.teiidVdbs = [];
            svcSrc.teiidVdbNames = [];
             try {
                RepoRestService.copyServerVdbsToWorkspace( ).then(
                    // Get workspace VDBs
                    function (result) {
                        initTeiidVdbs(pageId);
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
                        // Workspace should contain copies of server VDBs
                        RepoRestService.copy(wkspVdbs, svcSrc.serviceSources);
                        
                        // Set VDB status to distinguish server VDBs
                        var sourcesLength = svcSrc.serviceSources.length;
                        for (var i = 0; i < sourcesLength; i++) {
                            // If not deployed to server, set status to New
                            if(!contains(svcSrc.teiidVdbNames,svcSrc.serviceSources[i].keng__id)) {
                                setVdbStatus(svcSrc.serviceSources[i],"New");
                            // Deployed to server, set status to Active
                            } else {
                                setVdbStatus(svcSrc.serviceSources[i],"Active");
                            }
                        } 
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
         * Fetch the VDBs from the cachedTeiid and save them.  Then init the workspace VDBs
         */
        function initTeiidVdbs(pageId) {
            try {
                RepoRestService.getVdbs(REST_URI.TEIID_SERVICE).then(
                    function (serverVdbs) {
                        RepoRestService.copy(serverVdbs, svcSrc.teiidVdbs);
                        
                        // Save names of server VDB
                        var teiidVdbsLength = svcSrc.teiidVdbs.length;
                        for (var i = 0; i < teiidVdbsLength; i++) {
                            svcSrc.teiidVdbNames.push(svcSrc.teiidVdbs[i].keng__id);
                        } 
                        
                        // Now get the workspace vdbs and set statuses
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
         * Set the VDB Status property
         */
        function setVdbStatus(theVdb, state) {
            var statusProperty = {};
            statusProperty.name = 'status';
            statusProperty.value = state;
            var props = [statusProperty];
            theVdb[VDB_KEYS.PROPERTIES] = props;
        }

        /*
         * determine if the supplied vdb exists on the server
         */
        service.setLoading = function(isLoading) {
            setLoading(isLoading);
        };

        /*
         * determine if the supplied vdb exists on the server
         */
        service.isTeiidVdb = function(vdbName) {
            var teiidVdbsLength = svcSrc.teiidVdbNames.length;
            for(var i=0; i<teiidVdbsLength; i++) {
                if(svcSrc.teiidVdbNames[i] === vdbName) {
                    return true;
                }
            }
            return false;
        };

        /*
         * updates vdb status
         */
        service.updateStatus = function(vdb, status) {
            setVdbStatus(vdb,status);
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

            // Update the selected source modelName and TranslatorName - only if its in local workspace
            if(svcSrc.serviceSource!==null && svcSrc.serviceSource.keng__dataPath!==null && svcSrc.serviceSource.keng__dataPath.indexOf("tko:workspace") >= 0) {
                // Update the selected source ModelName and TranslatorName
                try {
                    RepoRestService.getVdbModels(svcSrc.serviceSource.keng__id).then(
                        function (models) {
                            svcSrc.selectedSvcSrcModelName = models[0].keng__id;
                            RepoRestService.getVdbModelSources(svcSrc.serviceSource.keng__id,models[0].keng__id).then(
                                function (modelSources) {
                                    svcSrc.selectedSvcSrcTranslatorName = modelSources[0].vdb__sourceTranslator;
                                    // Useful for broadcasting the selected service source has been updated
                                    $rootScope.$broadcast("selectedServiceSourceChanged", svcSrc.serviceSource);
                                },
                                function (response) {
                                    throw RepoRestService.newRestException("Failed getting VDB Translator name.\n" + response.message);
                                });
                        },
                        function (response) {
                            throw RepoRestService.newRestException("Failed getting VDB Connection name.\n" + response.message);
                        });
                } catch (error) {
                }
            }
        };

        /*
         * return selected serviceSource
         */
        service.selectedServiceSource = function() {
            return svcSrc.serviceSource;
        };

        /*
         * return selected serviceSource model name
         */
        service.selectedServiceSourceConnectionName = function() {
            return svcSrc.selectedSvcSrcModelName;
        };

        /*
         * return selected serviceSource translator name
         */
        service.selectedServiceSourceTranslatorName = function() {
            return svcSrc.selectedSvcSrcTranslatorName;
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
        
        return service;
    }

})();
