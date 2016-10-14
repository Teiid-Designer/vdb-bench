(function () {
    'use strict';

    var pluginName = 'vdb-bench.dataservice';
    var pluginDirName = 'vdb-bench-dataservice';

    angular
        .module(pluginName)
        .controller('SvcSourceEditController', SvcSourceEditController);

    SvcSourceEditController.$inject = ['$scope', '$rootScope', 'REST_URI', 'SYNTAX', 'RepoRestService', 
                                       'SvcSourceSelectionService', 'ConnectionSelectionService', 'TranslatorSelectionService'];

    function SvcSourceEditController($scope, $rootScope, REST_URI, SYNTAX, RepoRestService, 
                                      SvcSourceSelectionService, ConnectionSelectionService, TranslatorSelectionService) {
        var vm = this;

        vm.connsLoading = ConnectionSelectionService.isLoading();
        vm.allConnections = ConnectionSelectionService.getConnections();
        
        vm.transLoading = TranslatorSelectionService.isLoading();
        vm.allTranslators = TranslatorSelectionService.getTranslators();

        /*
         * When the connections have been loaded
         */
        $scope.$on('loadingConnectionsChanged', function (event, loading) {
            vm.connsLoading = loading;
            if(vm.connsLoading === false) {
                vm.allConnections = ConnectionSelectionService.getConnections();
                var successCallback = function(modelName) {
                    for (var i = 0; i < vm.allConnections.length; i++) {
                        if(vm.allConnections[i].keng__id === modelName) {
                            vm.connection = vm.allConnections[i];
                        }
                    }
                };

                var failureCallback = function(errorMsg) {
                	alert("Failed to get connection: \n"+errorMsg);
                };
                SvcSourceSelectionService.selectedServiceSourceConnectionName(successCallback,failureCallback);
           }
        });
        
        /*
         * When the translators have been loaded
         */
        $scope.$on('loadingTranslatorsChanged', function (event, loading) {
            vm.transLoading = loading;
            if(vm.transLoading === false) {
                vm.allTranslators = TranslatorSelectionService.getTranslators();
                var successCallback = function(translatorName) {
                    for (var i = 0; i < vm.allTranslators.length; i++) {
                        if(vm.allTranslators[i].keng__id === translatorName) {
                            vm.translator = vm.allTranslators[i];
                        }
                    }
                };

                var failureCallback = function(errorMsg) {
                	alert("Failed to get translator: \n"+errorMsg);
                };
                SvcSourceSelectionService.selectedServiceSourceTranslatorName(successCallback,failureCallback);
           }
        });
        
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
         * Can a source be updated
         */
        vm.canUpdateSvcSource = function() {
            if (angular.isUndefined(vm.svcSourceName) ||
                vm.svcSourceName === null || vm.svcSourceName === SYNTAX.EMPTY_STRING)
                return false;

            if (angular.isUndefined(vm.connection) || vm.connection === null)
                return false;

            if (angular.isUndefined(vm.translator) || vm.translator === null)
                return false;

            return true;
        };

        // Event handler for clicking the save button
        vm.onEditSvcSourceClicked = function () {
            if (! vm.canUpdateSvcSource())
                return;

            var connectionName = vm.connection.keng__id;
            var jndiName = vm.connection.dv__jndiName;
            var translatorName = vm.translator.keng__id;

            try {
                RepoRestService.updateVdbModelSource( vm.svcSourceName, connectionName, connectionName, translatorName, jndiName ).then(
                    function (theModelSource) {
                    	updateVdbDescription( vm.svcSourceName, vm.svcSourceDescription);
                    },
                    function (response) {
                        throw RepoRestService.newRestException("Failed to update the service source. \n" + response.message);
                    });
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
                        // Reinitialise the list of service sources
                        SvcSourceSelectionService.refresh("datasource-summary");
                    },
                    function (resp) {
                        // Reinitialise the list of service sources
                        SvcSourceSelectionService.refresh("datasource-summary");
                    });
            } catch (error) {
                // Reinitialise the list of service sources
                SvcSourceSelectionService.refresh("datasource-summary");
            }
        }

    }

})();
