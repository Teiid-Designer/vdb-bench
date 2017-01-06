(function () {
    'use strict';

    var pluginName = 'vdb-bench.dataservice';
    var pluginDirName = 'vdb-bench-dataservice';

    angular
        .module(pluginName)
        .controller('SvcSourceNewController', SvcSourceNewController);

    SvcSourceNewController.$inject = ['$scope', '$rootScope', '$translate', 'REST_URI', 'SYNTAX', 'RepoRestService',
                                      'SvcSourceSelectionService', 'ConnectionSelectionService', 'TranslatorSelectionService'];

    function SvcSourceNewController($scope, $rootScope, $translate, REST_URI, SYNTAX, RepoRestService,
                                     SvcSourceSelectionService, ConnectionSelectionService, TranslatorSelectionService) {
        var vm = this;

        vm.numberSources = 0;

        vm.selectedConnection = null;
        vm.selectedJdbcConnection = null;
        vm.selectedTranslator = null;
        vm.showNameAndDescription = false;
        vm.showTranslator = false;
        vm.selectedTranslator = null;
        vm.selectedTranslatorImage = null;
        vm.allTranslators = TranslatorSelectionService.getTranslators(false);
        vm.filterSchema = false;
        
        vm.createAndDeployInProgress = false;

        /*
         * Handle Change in selected connection
         */
        $scope.$on('selectedConnectionChanged', function (event) {
            // Deselect filter checkbox
            vm.filterSchema = false;

            vm.selectedConnection = ConnectionSelectionService.selectedConnection();
            if(vm.selectedConnection !== null) {
                selectTranslatorForConnection(vm.selectedConnection.keng__id);
                if(vm.selectedConnection.dv__type === true) {
                    vm.selectedJdbcConnection = vm.selectedConnection;
                } else {
                    vm.selectedJdbcConnection = null;
                }
            } else {
                vm.selectedTranslator = null;
                vm.selectedTranslatorImage = null;
                vm.selectedJdbcConnection = null;
                updateTranslatorVisibility();
                updateNameDescriptionVisibility();
            }
        });

        /*
         * When loading finishes on create / deploy
         */
        $scope.$on('loadingServiceSourcesChanged', function (event, loadingState) {
            if (vm.createAndDeployInProgress === loadingState)
                return;

            if(loadingState === false) {
                vm.createAndDeployInProgress = false;
            }
        });

        /**
         * Creates and Deploys the Service Source VDB
         */
        function selectTranslatorForConnection ( connectionName ) {
            
            // Gets the suggested translator for the Teiid connection type and sets the selection
            try {
                RepoRestService.getDefaultTranslatorForConnection( connectionName ).then(
                    function (result) {
                        var translatorName = result.Information.Translator;
                        if(translatorName === 'unknown') {
                            vm.selectedTranslator = null;
                            vm.selectedTranslatorImage = TranslatorSelectionService.getImageLink(null);
                        } else {
                            for (var i = 0; i < vm.allTranslators.length; i++) {
                                if (vm.allTranslators[i].keng__id === translatorName) {
                                    vm.selectedTranslator = vm.allTranslators[i];
                                    vm.selectedTranslatorImage = TranslatorSelectionService.getImageLink(vm.selectedTranslator.keng__id);
                                    break;
                                }
                            }
                        }
                        updateTranslatorVisibility();
                        updateNameDescriptionVisibility();
                    },
                    function (resp) {
                        updateTranslatorVisibility();
                        updateNameDescriptionVisibility();
                        var fetchFailedMsg = $translate.instant('svcSourceNewController.getTranslatorsFailedMsg');
                        throw RepoRestService.newRestException(fetchFailedMsg + "\n" + RepoRestService.responseMessage(resp));
                    });
            } catch (error) {
                updateTranslatorVisibility();
                updateNameDescriptionVisibility();
                var fetchFailedMsg = $translate.instant('svcSourceNewController.getTranslatorsFailedMsg');
                throw RepoRestService.newRestException(fetchFailedMsg + "\n" + error);
            }
        }

        /**
         * Creates and Deploys the Service Source VDB
         */
        function createAndDeploySvcSourceVdb ( svcSourceName, svcSourceDescription, connectionName, jndiName, translatorName, importerProperties ) {
            // Set in progress status
            vm.createAndDeployInProgress = true;
            vm.numberSources = SvcSourceSelectionService.getServiceSources().length;
            SvcSourceSelectionService.setLoading(true);
            
            // Creates the VDB.  On success, the VDB Model is added to the VDB
            try {
                RepoRestService.createVdb( svcSourceName, svcSourceDescription, true ).then(
                    function (theVdb) {
                        if(theVdb.keng__id === svcSourceName) {
                            createVdbModel( svcSourceName, connectionName, translatorName, jndiName, importerProperties );
                        }
                    },
                    function (resp) {
                        SvcSourceSelectionService.setLoading(false);
                        var sourceCreateFailedMsg = $translate.instant('svcSourceNewController.sourceCreateFailedMsg');
                        alert(sourceCreateFailedMsg + "\n" + RepoRestService.responseMessage(resp));
                        SvcSourceSelectionService.refresh('datasource-summary');
                    });
            } catch (error) {
                SvcSourceSelectionService.setLoading(false);
                var sourceCreateFailedMsg = $translate.instant('svcSourceNewController.sourceCreateFailedMsg');
                alert(sourceCreateFailedMsg + "\n" + error);
                SvcSourceSelectionService.refresh('datasource-summary');
            }
        }

        /**
         * Create a Model and ModelSource within the VDB, then deploy it
         */
        function createVdbModel( svcSourceName, connectionName, translatorName, jndiName, importerProperties ) {
            // Creates the Model within the VDB, then add the ModelSource to the Model
            try {
                RepoRestService.createVdbModel( svcSourceName, connectionName, true, importerProperties ).then(
                    function (theModel) {
                        if(theModel.keng__id === connectionName) {
                            createVdbModelSource( svcSourceName, connectionName, connectionName, translatorName, jndiName );
                        }
                    },
                    function (resp) {
                        SvcSourceSelectionService.setLoading(false);
                        var sourceModelCreateFailedMsg = $translate.instant('svcSourceNewController.sourceModelCreateFailedMsg');
                        alert(sourceModelCreateFailedMsg + "\n" + RepoRestService.responseMessage(resp));
                        SvcSourceSelectionService.refresh('datasource-summary');
                    });
            } catch (error) {
                SvcSourceSelectionService.setLoading(false);
                var sourceModelCreateFailedMsg = $translate.instant('svcSourceNewController.sourceModelCreateFailedMsg');
                alert(sourceModelCreateFailedMsg + "\n" + error);
                SvcSourceSelectionService.refresh('datasource-summary');
            }
        }

        /**
         * Create a ModelSource within the VDB Model, then deploy the VDB
         */
        function createVdbModelSource( vdbName, modelName, sourceName, translatorName, jndiName ) {
            // Creates the ModelSource within the VDB Model, then deploys the completed VDB
            try {
                RepoRestService.createVdbModelSource( vdbName, modelName, sourceName, translatorName, jndiName ).then(
                    function (theModelSource) {
                        deployVdb( vdbName );
                    },
                    function (resp) {
                        SvcSourceSelectionService.setLoading(false);
                        var sourceModelConnectionCreateFailedMsg = $translate.instant('svcSourceNewController.sourceModelConnectionCreateFailedMsg');
                        alert(sourceModelConnectionCreateFailedMsg + "\n" + RepoRestService.responseMessage(resp));
                        SvcSourceSelectionService.refresh('datasource-summary');
                    });
            } catch (error) {
                SvcSourceSelectionService.setLoading(false);
                var sourceModelConnectionCreateFailedMsg = $translate.instant('svcSourceNewController.sourceModelConnectionCreateFailedMsg');
                alert(sourceModelConnectionCreateFailedMsg + "\n" + error);
                SvcSourceSelectionService.refresh('datasource-summary');
            }
        }

        /**
         * Deploys the specified VDB to the server
         */
        function deployVdb(vdbName) {
            // Deploy the VDB to the server.  At the end, fire notification to go to summary page
            try {
                SvcSourceSelectionService.setDeploying(true, vdbName, false, null);
                RepoRestService.deployVdb( vdbName ).then(
                    function ( result ) {
                        vm.deploymentSuccess = (result.Information.deploymentSuccess === "true");
                        if(vm.deploymentSuccess === true) {
                            var successCallback = function() {
                                SvcSourceSelectionService.setDeploying(false, vdbName, true, null);
                                // Refresh and direct to appropriate page.  If no sources prior to this create, go directly to new service page
                                if(vm.numberSources===0) {
                                    SvcSourceSelectionService.refresh('dataservice-new');
                                } else {
                                    SvcSourceSelectionService.refresh('datasource-summary');
                                }
                            };
                            var failCallback = function(failMessage) {
                                SvcSourceSelectionService.setDeploying(false, vdbName, false, failMessage);
                                // Refresh and direct to summary page
                                SvcSourceSelectionService.refresh('datasource-summary');
                            };
                            //
                            // Monitors the source vdb to determine when its active
                            //
                            RepoRestService.pollForActiveVdb(vdbName, successCallback, failCallback);
                        } else {
                            SvcSourceSelectionService.setDeploying(false, vdbName, false, result.Information.ErrorMessage1);
                            SvcSourceSelectionService.refresh('dataservice-summary');
                        }
                   },
                    function (response) {
                        SvcSourceSelectionService.setDeploying(false, vdbName, false, RepoRestService.responseMessage(response));
                        SvcSourceSelectionService.setLoading(false);
                        var sourceDeployFailedMsg = $translate.instant('svcSourceNewController.sourceDeployFailedMsg');
                        alert(sourceDeployFailedMsg + "\n" + RepoRestService.responseMessage(response));
                        SvcSourceSelectionService.refresh('datasource-summary');
                    });
            } catch (error) {
                SvcSourceSelectionService.setLoading(false);
                var sourceDeployFailedMsg = $translate.instant('svcSourceNewController.sourceDeployFailedMsg');
                alert(sourceDeployFailedMsg + "\n" + error);
                SvcSourceSelectionService.refresh('datasource-summary');
            }
        }

        /**
         * should show name and description
         */
        function updateNameDescriptionVisibility() {
            if(vm.selectedConnection === null || vm.selectedTranslator === null) {
                vm.showNameAndDescription = false;
            } else {
                vm.showNameAndDescription = true;
            }
        }

        /**
         * should show translator dropdown
         */
        function updateTranslatorVisibility() {
            if(vm.selectedConnection === null) {
                vm.showTranslator = false;
            } else {
                vm.showTranslator = true;
            }
        }

        /**
         * handles filter checkbox change
         */
        vm.filterCheckboxChanged = function() {
            // requests the filter component to refresh
            if(vm.filterSchema) {
                $rootScope.$broadcast("resetJdbcFilters");
            } else {
                // Deselecting the filter checkbox resets the filters
                ConnectionSelectionService.resetFilterProperties();
            }
        };

        /**
         * handles translator change
         */
        vm.translatorChanged = function() {
            if(vm.selectedTranslator===null) {
                vm.selectedTranslatorImage = TranslatorSelectionService.getImageLink(null);
            } else {
                vm.selectedTranslatorImage = TranslatorSelectionService.getImageLink(vm.selectedTranslator.keng__id);
            }
            updateNameDescriptionVisibility();
        };

        /**
         * Can a new source be created
         */
        vm.canCreateSvcSource = function() {
            if (angular.isUndefined(vm.svcSourceName) ||
                vm.svcSourceName === null || vm.svcSourceName === SYNTAX.EMPTY_STRING)
                return false;

            if (angular.isUndefined(vm.selectedConnection) || vm.selectedConnection === null)
                return false;

            if (angular.isUndefined(vm.selectedTranslator) || vm.selectedTranslator === null)
                return false;

            return true;
        };

        // Event handler for clicking the create button
        vm.onCreateSvcSourceClicked = function () {
            if (! vm.canCreateSvcSource())
                return;

            var connectionName = vm.selectedConnection.keng__id;
            var jndiName = vm.selectedConnection.dv__jndiName;
            var translatorName = vm.selectedTranslator.keng__id;
            var importerProperties = ConnectionSelectionService.selectedConnectionFilterProperties();

            createAndDeploySvcSourceVdb( vm.svcSourceName, vm.svcSourceDescription, connectionName, jndiName, translatorName, importerProperties );
        };
    }

})();
