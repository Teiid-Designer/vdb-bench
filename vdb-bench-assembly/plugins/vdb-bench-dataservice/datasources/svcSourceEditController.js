(function () {
    'use strict';

    var pluginName = 'vdb-bench.dataservice';
    var pluginDirName = 'vdb-bench-dataservice';

    angular
        .module(pluginName)
        .controller('SvcSourceEditController', SvcSourceEditController);

    SvcSourceEditController.$inject = ['$scope', '$rootScope', 'REST_URI', 'RepoRestService', 
                                       'SvcSourceSelectionService', 'ConnectionSelectionService', 'TranslatorSelectionService'];

    function SvcSourceEditController($scope, $rootScope, REST_URI, RepoRestService, 
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
                var modelName = SvcSourceSelectionService.selectedServiceSourceConnectionName();
                for (var i = 0; i < vm.allConnections.length; i++) {
                    if(vm.allConnections[i].keng__id === modelName) {
                        $scope.selectedConnection = vm.allConnections[i];
                    }
                }
           }
        });
        /*
         * When the translators have been loaded
         */
        $scope.$on('loadingTranslatorsChanged', function (event, loading) {
            vm.transLoading = loading;
            if(vm.transLoading === false) {
                vm.allTranslators = TranslatorSelectionService.getTranslators();
                var transName = SvcSourceSelectionService.selectedServiceSourceTranslatorName();
                for (var i = 0; i < vm.allTranslators.length; i++) {
                    if(vm.allTranslators[i].keng__id === transName) {
                        $scope.selectedTranslator = vm.allTranslators[i];
                    }
                }
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

        
        // Event handler for clicking the save button
        vm.onEditSvcSourceClicked = function ( svcSourceName, svcSourceDescription, connectionName, jndiName, translatorName ) {
            try {
                RepoRestService.createVdb( svcSourceName, svcSourceDescription ).then(
                    function (theVdb) {
                        if(theVdb.keng__id === svcSourceName) {
                            RepoRestService.createVdbModel( svcSourceName, connectionName ).then(
                                function (theModel) {
                                    if(theModel.keng__id === connectionName) {
                                        RepoRestService.createVdbModelSource( svcSourceName, connectionName, connectionName, translatorName, jndiName ).then(
                                            function (theModelSource) {
                                                //alert("Created VDB, Model and ModelSource!");
                                            },
                                            function (resp) {
                                                throw RepoRestService.newRestException("Failed to create the source model. \n" + resp.message);
                                            }
                                    );
                                    }
                                },
                                function (resp) {
                                    throw RepoRestService.newRestException("Failed to create the source model. \n" + resp.message);
                                }
                        );
                        }
                        // Reinitialise the list of service sources
                        SvcSourceSelectionService.refresh("datasource-summary");
                    },
                    function (response) {
                        throw RepoRestService.newRestException("Failed to create the service source. \n" + response.message);
                    });
            } catch (error) {} finally {
            }
        };
    }

})();
