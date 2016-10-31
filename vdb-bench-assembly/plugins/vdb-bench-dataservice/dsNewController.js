(function () {
    'use strict';

    var pluginName = 'vdb-bench.dataservice';
    var pluginDirName = 'vdb-bench-dataservice';

    angular
        .module(pluginName)
        .controller('DSNewController', DSNewController);

    DSNewController.$inject = ['$scope', '$rootScope', 'REST_URI', 'SYNTAX', 'RepoRestService', 'DSSelectionService', 
                               'SvcSourceSelectionService', 'TableSelectionService'];

    function DSNewController($scope, $rootScope, REST_URI, SYNTAX, RepoRestService, DSSelectionService, 
                             SvcSourceSelectionService, TableSelectionService) {
        var vm = this;
        
        vm.svcSourcesLoading = SvcSourceSelectionService.isLoading();
        vm.svcSources = SvcSourceSelectionService.getServiceSources();
        vm.hasSources = vm.svcSources.length>0;
        vm.selectedSrc = null;
        vm.selectedTable = null;
        vm.showNameAndDescription = false;
        
        SvcSourceSelectionService.selectServiceSource(null);
        TableSelectionService.selectTable(null);
        
        /*
         * When the selected service source changed
         */
        $scope.$on('selectedServiceSourceChanged', function (event) {
            vm.selectedSrc = SvcSourceSelectionService.selectedServiceSource();
            vm.selectedTable = null;
            updateNameDescriptionState();
            if(vm.selectedSrc === null) {
                // Requests modelTable to refresh
                $rootScope.$broadcast("refreshModelTableList");
                return;
            }
            // Get Selected source name
            var selSvcSourceName = vm.selectedSrc.keng__id;
            
            // Gets selected model name, then builds a temp model based on its ddl
            var successCallback = function(selSvcSourceModelName) {
                // Create Temp Model in the workspace using the selected model ddl
                buildTempVdbAndModel(selSvcSourceName,selSvcSourceModelName);
            };

            var failureCallback = function(errorMsg) {
                alert("Failed to get connection: \n"+errorMsg);
            };
            
            SvcSourceSelectionService.selectedServiceSourceConnectionName(successCallback, failureCallback);
        });

        /*
         * When the selected table changes
         */
        $scope.$on('selectedTableChanged', function (event) {
            vm.selectedTable = TableSelectionService.selectedTable();
            updateNameDescriptionState();
        });
        
        // Gets the available service sources
        vm.getSvcSources = function() {
            return vm.svcSources;
        };
        
        function isNullEmptyOrUndefined(value) {
            return !value;
        }
        
        /**
         * Creates a temp model in the workspace from teiid DDL.  Temp model is used to build the Views
         */
        function buildTempVdbAndModel ( vdbName, modelName ) {
            // Gets the teiid model schema.  If successful, create a temp model using the schema
            try {
                RepoRestService.updateVdbModelFromDdl( SYNTAX.TEMP+vdbName, modelName, vdbName, modelName ).then(
                        function ( result ) {
                            // Requests modelTable to refresh
                            $rootScope.$broadcast("refreshModelTableList");
                        },
                        function (response) {
                            // Requests modelTable to refresh
                            $rootScope.$broadcast("refreshModelTableList");
                        });
            } catch (error) {
                // Requests modelTable to refresh
                $rootScope.$broadcast("refreshModelTableList");
            } finally {
            }
        }

        /**
         * Can a new source be created
         */
        vm.canCreateDataService = function() {
            if (angular.isUndefined(vm.serviceName) ||
                vm.serviceName === null || vm.serviceName === SYNTAX.EMPTY_STRING)
                return false;
            
            var selectedSrc = SvcSourceSelectionService.selectedServiceSource();
            if(selectedSrc===null) return false;

            var selectedTable = TableSelectionService.selectedTable();
            if(selectedTable === null) return false;

            return true;
        };

        /**
         * should show name and description
         */
        function updateNameDescriptionState() {
            if(vm.selectedTable === null || vm.selectedSrc === null) {
                vm.showNameAndDescription = false;
            } else {
                vm.showNameAndDescription = true;
            }
        }
        
        // Event handler for clicking the create button
        vm.onCreateDataServiceClicked = function ( ) {
            if (! vm.canCreateDataService())
                return;
            
            try {
                RepoRestService.createDataService( vm.serviceName, vm.serviceDescription ).then(
                    function () {
                        setDataserviceServiceVdb(vm.serviceName);
                    },
                    function (response) {
                        throw RepoRestService.newRestException("Failed to create the dataservice. \n" + RepoRestService.responseMessage(response));
                    });
            } catch (error) {} finally {
            }
        };
        
        /**
         * Sets the service VDB based on the table selections
         */
        function setDataserviceServiceVdb( dataserviceName ) {
            // Gets the VDB / Model / Table selections
            var selectedSrc = SvcSourceSelectionService.selectedServiceSource();
            var selSvcSourceName = selectedSrc.keng__id;
            
            // Gets selected model name, create the dataservice VDB
            var successCallback = function(selSvcSourceModelName) {
                var table = TableSelectionService.selectedTable();
                var tableName = table.keng__id;
                
                // Path to modelSource and temp table for definition of the dataservice vdb
                var relativeModelSourcePath = selSvcSourceName+"/"+selSvcSourceModelName+"/vdb:sources/"+selSvcSourceModelName;
                var relativeTablePath = SYNTAX.TEMP+selSvcSourceName+"/"+selSvcSourceModelName+"/"+tableName;
                
                try {
                    RepoRestService.setDataServiceVdbForSingleTable( dataserviceName, relativeTablePath, relativeModelSourcePath ).then(
                        function () {
                            // Reinitialise the list of data services
                            DSSelectionService.refresh();
                            // Broadcast the pageChange
                            $rootScope.$broadcast("dataServicePageChanged", 'dataservice-summary');
                        },
                        function (response) {
                            throw RepoRestService.newRestException("Failed to update the dataservice. \n" + RepoRestService.responseMessage(response));
                        });
                } catch (error) {} finally {
                }
            };

            var failureCallback = function(errorMsg) {
                alert("Failed to get connection: \n"+errorMsg);
            };
            
            SvcSourceSelectionService.selectedServiceSourceConnectionName(successCallback, failureCallback);
        }

    }

})();
