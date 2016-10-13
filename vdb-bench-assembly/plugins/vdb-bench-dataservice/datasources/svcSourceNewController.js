(function () {
    'use strict';

    var pluginName = 'vdb-bench.dataservice';
    var pluginDirName = 'vdb-bench-dataservice';

    angular
        .module(pluginName)
        .controller('SvcSourceNewController', SvcSourceNewController);

    SvcSourceNewController.$inject = ['$scope', '$rootScope', 'REST_URI', 'SYNTAX', 'RepoRestService',
                                      'SvcSourceSelectionService', 'ConnectionSelectionService', 'TranslatorSelectionService'];

    function SvcSourceNewController($scope, $rootScope, REST_URI, SYNTAX, RepoRestService,
                                     SvcSourceSelectionService, ConnectionSelectionService, TranslatorSelectionService) {
        var vm = this;

        vm.connsLoading = ConnectionSelectionService.isLoading();
        vm.allConnections = ConnectionSelectionService.getConnections();
        
        vm.transLoading = TranslatorSelectionService.isLoading();
        vm.allTranslators = TranslatorSelectionService.getTranslators();
        
        vm.createAndDeployInProgress = false;
        
        /*
         * When connection loading state changes
         */
        $scope.$on('loadingConnectionsChanged', function (event, loadingState) {
            vm.connsLoading = loadingState;
            if(vm.connsLoading === false) {
                vm.allConnections = ConnectionSelectionService.getConnections();
            }
        });
        
        /*
         * When translator loading state changes
         */
        $scope.$on('loadingTranslatorsChanged', function (event, loadingState) {
            vm.transLoading = loadingState;
            if(vm.transLoading === false) {
                vm.allTranslators = TranslatorSelectionService.getTranslators();
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
        function createAndDeploySvcSourceVdb ( svcSourceName, svcSourceDescription, connectionName, jndiName, translatorName ) {
            // Set loading true for modal popup
            vm.createAndDeployInProgress = true;
            SvcSourceSelectionService.setLoading(true);
            
            // Creates the VDB.  On success, the VDB Model is added to the VDB
            try {
                RepoRestService.createVdb( svcSourceName, svcSourceDescription, true ).then(
                    function (theVdb) {
                        if(theVdb.keng__id === svcSourceName) {
                            createVdbModel( svcSourceName, connectionName, translatorName, jndiName );
                        }
                    },
                    function (resp) {
                        SvcSourceSelectionService.setLoading(false);
                        throw RepoRestService.newRestException("Failed to create the service source Vdb. \n" + RepoRestService.responseMessage(resp));
                    });
            } catch (error) {
                SvcSourceSelectionService.setLoading(false);
                throw RepoRestService.newRestException("Failed to create the service source Vdb. \n" + error);
            }
        }

        /**
         * Create a Model and ModelSource within the VDB, then deploy it
         */
        function createVdbModel( svcSourceName, connectionName, translatorName, jndiName ) {
            // Creates the Model within the VDB, then add the ModelSource to the Model
            try {
                RepoRestService.createVdbModel( svcSourceName, connectionName ).then(
                    function (theModel) {
                        if(theModel.keng__id === connectionName) {
                            createVdbModelSource( svcSourceName, connectionName, connectionName, translatorName, jndiName );
                        }
                    },
                    function (resp) {
                        SvcSourceSelectionService.setLoading(false);
                        throw RepoRestService.newRestException("Failed to create the source model. \n" + RepoRestService.responseMessage(resp));
                    });
            } catch (error) {
                SvcSourceSelectionService.setLoading(false);
                throw RepoRestService.newRestException("Failed to create the source model. \n" + error);
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
                        throw RepoRestService.newRestException("Failed to create the source model connection. \n" + RepoRestService.responseMessage(resp));
                    });
            } catch (error) {
                SvcSourceSelectionService.setLoading(false);
                throw RepoRestService.newRestException("Failed to create the source model connection. \n" + error);
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
                        // Reinitialise the list of service sources
                        SvcSourceSelectionService.refresh('datasource-summary');
                   },
                    function (response) {
                        SvcSourceSelectionService.setDeploying(false, vdbName, false, RepoRestService.responseMessage(response));
                        SvcSourceSelectionService.setLoading(false);
                        throw RepoRestService.newRestException("Failed to deploy the Service-source. \n" + RepoRestService.responseMessage(response));
                    });
            } catch (error) {
                SvcSourceSelectionService.setLoading(false);
                throw RepoRestService.newRestException("Failed to deploy the Service-source. \n" + error);
            }
        }

        /**
         * Access to the collection of connections
         */
        vm.getConnections = function() {
            return vm.allConnections;
        };

        /**
         * Access to the collection of translators
         */
        vm.getTranslators = function() {
            return vm.allTranslators;
        };

        /**
         * Can a new source be created
         */
        vm.canCreateSvcSource = function() {
            if (angular.isUndefined(vm.svcSourceName) ||
                vm.svcSourceName === null || vm.svcSourceName === SYNTAX.EMPTY_STRING)
                return false;

            if (angular.isUndefined(vm.connection) || vm.connection === null)
                return false;

            if (angular.isUndefined(vm.translator) || vm.translator === null)
                return false;

            return true;
        };

        // Event handler for clicking the create button
        vm.onCreateSvcSourceClicked = function () {
            if (! vm.canCreateSvcSource())
                return;

            var connectionName = vm.connection.keng__id;
            var jndiName = vm.connection.dv__jndiName;
            var translatorName = vm.translator.keng__id;

            createAndDeploySvcSourceVdb( vm.svcSourceName, vm.svcSourceDescription, connectionName, jndiName, translatorName );
        };
    }

})();
