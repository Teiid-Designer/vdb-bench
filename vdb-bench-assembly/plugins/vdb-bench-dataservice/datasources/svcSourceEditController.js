(function () {
    'use strict';

    var pluginName = 'vdb-bench.dataservice';
    var pluginDirName = 'vdb-bench-dataservice';

    angular
        .module(pluginName)
        .controller('SvcSourceEditController', SvcSourceEditController);

    SvcSourceEditController.$inject = ['$scope', '$rootScope', '$translate', '$document', 'REST_URI', 'SYNTAX', 'RepoRestService', 
                                       'SvcSourceSelectionService', 'ConnectionSelectionService', 'TranslatorSelectionService'];

    function SvcSourceEditController($scope, $rootScope, $translate, $document, REST_URI, SYNTAX, RepoRestService, 
                                      SvcSourceSelectionService, ConnectionSelectionService, TranslatorSelectionService) {
        var vm = this;

        vm.originalConnectionName = null;
        vm.initialConnectionName = null;
        vm.initialConnectionJndi = null;
        vm.connectionInit = true;
        vm.selectedSource = SvcSourceSelectionService.selectedServiceSource();
        vm.selectedConnection = null;
        vm.selectedTranslator = TranslatorSelectionService.selectedTranslator();
        vm.selectedTranslatorImage = null;
        vm.transLoading = TranslatorSelectionService.isLoading();
        vm.connsLoading = ConnectionSelectionService.isLoading();
        vm.allTranslators = TranslatorSelectionService.getTranslators();
        vm.updateAndDeployInProgress = false;

        /*
         * Set initial source selection
         */
        $document.ready(function () {
            // Initialize the selections if possible for the selected connection
            vm.initialConnectionName = SvcSourceSelectionService.getEditSourceConnectionNameSelection();
            vm.originalConnectionName = vm.initialConnectionName;
            vm.initialConnectionJndi = SvcSourceSelectionService.getEditSourceConnectionJndiSelection();
            vm.selectedTranslator = TranslatorSelectionService.selectedTranslator();
            vm.selectedTranslatorImage = TranslatorSelectionService.getImageLink(vm.selectedTranslator.keng__id);
            vm.selectedSource = SvcSourceSelectionService.selectedServiceSource();
        });
        
        /*
         * Handler for selected connection changes
         */
        $scope.$on('selectedConnectionChanged', function (event) {
            vm.selectedConnection = ConnectionSelectionService.selectedConnection();
            // The initial Connection selection is cleared after the first change event
            if (vm.connectionInit===false) {
                vm.initialConnectionName = null;
                vm.initialConnectionJndi = null;
                if(vm.selectedConnection !== null) {
                    selectTranslatorDefaultForConnection(vm.selectedConnection.keng__id);
                } else {
                    vm.selectedTranslator = null;
                    vm.selectedTranslatorImage = TranslatorSelectionService.getImageLink(null);
                }
            }
            vm.connectionInit = false;
        });

        /*
         * Handler for connection loading changes
         */
        $scope.$on('loadingConnectionsChanged', function (event, loading) {
            vm.connsLoading = loading;
        });

        /*
         * Handler for translator loading changes
         */
        $scope.$on('loadingTranslatorsChanged', function (event, loading) {
            vm.transLoading = loading;
        });

        /*
         * When loading finishes on create / deploy
         */
        $scope.$on('loadingServiceSourcesChanged', function (event, loadingState) {
            if (vm.updateAndDeployInProgress === loadingState)
                return;

            if(loadingState === false) {
                vm.updateAndDeployInProgress = false;
            }
        });

        /**
         * handles translator change
         */
        vm.translatorChanged = function() {
            if(vm.selectedTranslator===null) {
                vm.selectedTranslatorImage = TranslatorSelectionService.getImageLink(null);
            } else {
                vm.selectedTranslatorImage = TranslatorSelectionService.getImageLink(vm.selectedTranslator.keng__id);
            }
        };

        /**
         * Set the selected translator default
         */
        function selectTranslatorDefaultForConnection ( connectionName ) {
            
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
                    },
                    function (resp) {
                        var fetchFailedMsg = $translate.instant('svcSourceEditController.getTranslatorsFailedMsg');
                        throw RepoRestService.newRestException(fetchFailedMsg + "\n" + RepoRestService.responseMessage(resp));
                    });
            } catch (error) {
                var fetchFailedMsg = $translate.instant('svcSourceEditController.getTranslatorsFailedMsg');
                throw RepoRestService.newRestException(fetchFailedMsg + "\n" + error);
            }
        }

        /**
         * Can a source be updated
         */
        vm.canUpdateSvcSource = function() {
            if (angular.isUndefined(vm.svcSourceName) ||
                vm.svcSourceName === null || vm.svcSourceName === SYNTAX.EMPTY_STRING)
                return false;

            if (vm.initialConnectionName !== null && vm.intialConnectionJndi !== null && vm.selectedTranslator !== null) {
                return true;
            }

            if (angular.isUndefined(vm.selectedConnection) || vm.selectedConnection === null)
                return false;

            if (angular.isUndefined(vm.selectedTranslator) || vm.selectedTranslator === null)
                return false;

            return true;
        };

        // Event handler for clicking the save button
        vm.onEditSvcSourceClicked = function () {
            if (! vm.canUpdateSvcSource())
                return;

            var connectionName = null;
            var jndiName = null;
            var translatorName = null;
            if (vm.initialConnectionName !== null && vm.intialConnectionJndi !== null && vm.selectedTranslator !== null) {
                connectionName = vm.initialConnectionName;
                jndiName = vm.initialConnectionJndi;
                translatorName = vm.selectedTranslator.keng__id;
            } else {
                connectionName = vm.selectedConnection.keng__id;
                jndiName = vm.selectedConnection.dv__jndiName;
                translatorName = vm.selectedTranslator.keng__id;
            }

            // Set in progress status
            vm.updateAndDeployInProgress = true;
            
            try {
                // If a different connection was chosen, the original VdbModel must be deleted
                if(connectionName !== vm.originalConnectionName) {
                    RepoRestService.deleteVdbModel( vm.svcSourceName, vm.startingConnectionName).then(
                            function (theModelSource) {
                                createVdbModel( vm.svcSourceName, connectionName, translatorName, jndiName );
                            },
                            function (response) {
                                var sourceUpdateFailedMsg = $translate.instant('svcSourceEditController.sourceUpdateFailedMsg');
                                throw RepoRestService.newRestException(sourceUpdateFailedMsg + "\n" + RepoRestService.responseMessage(response));
                            });
                // Connection was not changed, we can update the existing model source
                } else {
                    RepoRestService.updateVdbModelSource( vm.svcSourceName, connectionName, connectionName, translatorName, jndiName ).then(
                        function (theModelSource) {
                        	updateVdbDescription( vm.svcSourceName, vm.svcSourceDescription);
                        },
                        function (response) {
                            var sourceUpdateFailedMsg = $translate.instant('svcSourceEditController.sourceUpdateFailedMsg');
                            throw RepoRestService.newRestException(sourceUpdateFailedMsg + "\n" + RepoRestService.responseMessage(response));
                        });
                }
            } catch (error) {} finally {
            }
        };

        /**
         * Update the VDB description
         */
        function updateVdbDescription( svcSourceName, svcSourceDescription ) {
            // Creates the Model within the VDB, then add the ModelSource to the Model
            try {
                RepoRestService.updateVdb( svcSourceName, svcSourceDescription, true ).then(
                    function (theModel) {
                        deployVdb(svcSourceName);
                    },
                    function (resp) {
                        SvcSourceSelectionService.setLoading(false);
                        var sourceUpdateFailedMsg = $translate.instant('svcSourceEditController.sourceUpdateFailedMsg');
                        throw RepoRestService.newRestException(sourceUpdateFailedMsg + "\n" + RepoRestService.responseMessage(resp));
                    });
            } catch (error) {
                SvcSourceSelectionService.setLoading(false);
                var sourceUpdateFailedMsg = $translate.instant('svcSourceEditController.sourceUpdateFailedMsg');
                throw RepoRestService.newRestException(sourceUpdateFailedMsg + "\n" + error);
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
                            SvcSourceSelectionService.setDeploying(false, vdbName, true, null);
                        } else {
                            SvcSourceSelectionService.setDeploying(false, vdbName, false, result.Information.ErrorMessage1);
                        }
                        SvcSourceSelectionService.refresh('datasource-summary');
                   },
                    function (response) {
                        SvcSourceSelectionService.setDeploying(false, vdbName, false, RepoRestService.responseMessage(response));
                        SvcSourceSelectionService.setLoading(false);
                        var sourceDeployFailedMsg = $translate.instant('svcSourceEditController.sourceDeployFailedMsg');
                        throw RepoRestService.newRestException(sourceDeployFailedMsg + "\n" + RepoRestService.responseMessage(response));
                    });
            } catch (error) {
                SvcSourceSelectionService.setLoading(false);
                var sourceDeployFailedMsg = $translate.instant('svcSourceEditController.sourceDeployFailedMsg');
                throw RepoRestService.newRestException(sourceDeployFailedMsg + "\n" + error);
            }
        }
        
        /**
         * Create a Model and ModelSource within the VDB, then deploy it
         */
        function createVdbModel( svcSourceName, connectionName, translatorName, jndiName ) {
            // Creates the Model within the VDB, then add the ModelSource to the Model
            try {
                RepoRestService.createVdbModel( svcSourceName, connectionName, true ).then(
                    function (theModel) {
                        if(theModel.keng__id === connectionName) {
                            createVdbModelSource( svcSourceName, connectionName, connectionName, translatorName, jndiName );
                        }
                    },
                    function (resp) {
                        SvcSourceSelectionService.setLoading(false);
                        var sourceModelCreateFailedMsg = $translate.instant('svcSourceEditController.sourceModelCreateFailedMsg');
                        throw RepoRestService.newRestException(sourceModelCreateFailedMsg + "\n" + RepoRestService.responseMessage(resp));
                    });
            } catch (error) {
                SvcSourceSelectionService.setLoading(false);
                var sourceModelCreateFailedMsg = $translate.instant('svcSourceEditController.sourceModelCreateFailedMsg');
                throw RepoRestService.newRestException(sourceModelCreateFailedMsg + "\n" + error);
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
                        var sourceModelConnectionCreateFailedMsg = $translate.instant('svcSourceEditController.sourceModelConnectionCreateFailedMsg');
                        throw RepoRestService.newRestException(sourceModelConnectionCreateFailedMsg + "\n" + RepoRestService.responseMessage(resp));
                    });
            } catch (error) {
                SvcSourceSelectionService.setLoading(false);
                var sourceModelConnectionCreateFailedMsg = $translate.instant('svcSourceEditController.sourceModelConnectionCreateFailedMsg');
                throw RepoRestService.newRestException(sourceModelConnectionCreateFailedMsg + "\n" + error);
            }
        }

    }

})();
