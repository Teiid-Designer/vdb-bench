(function () {
    'use strict';

    var pluginName = 'vdb-bench.dataservice';
    var pluginDirName = 'vdb-bench-dataservice';

    angular
        .module(pluginName)
        .controller('DSEditController', DSEditController);

    DSEditController.$inject = ['$scope', '$rootScope', '$document', '$translate', 'REST_URI', 'SYNTAX', 'RepoRestService', 'DSSelectionService', 
                                'SvcSourceSelectionService', 'TableSelectionService'];

    function DSEditController($scope, $rootScope, $document, $translate, REST_URI, SYNTAX, RepoRestService, DSSelectionService, 
                               SvcSourceSelectionService, TableSelectionService) {
        var vm = this;
        
        vm.svcSourcesLoading = SvcSourceSelectionService.isLoading();
        vm.svcSources = SvcSourceSelectionService.getServiceSources();
        vm.initialSourceName = null;
        vm.initialSourceTableName = null;
        vm.sourceInit = true;
        vm.tableInit = true;

        /*
         * Set initial source selection
         */
        $document.ready(function () {
            // Initialize the selections if possible for the selected dataservice
            vm.initialSourceName = DSSelectionService.getEditSourceSelection();
            vm.initialSourceTableName = DSSelectionService.getEditSourceTableSelection();
        });

        /*
         * When the selected service source changed
         */
        $scope.$on('selectedServiceSourceChanged', function (event) {
            var selectedSrc = SvcSourceSelectionService.selectedServiceSource();
            if(selectedSrc === null) {
                // Requests modelTable to refresh
                $rootScope.$broadcast("refreshModelTableList");
                return;
            }
            // Get the source name
            var selectedSvcSourceName = selectedSrc.keng__id;
            
            // The initial Source selection is cleared after the first change event
            if (vm.sourceInit===false) {
                vm.initialSourceName = null;
                TableSelectionService.selectTable(null);
            }
            vm.sourceInit = false;

            // Gets selected model name, then builds a temp model based on its ddl
            var successCallback = function(model) {
                // Create Temp Model in the workspace using the selected model ddl
                buildTempVdbAndModel(selectedSvcSourceName,model.keng__id);
            };

            var failureCallback = function(errorMsg) {
                alert($translate.instant('shared.changedConnectionFailedMsg', {errorMsg: errorMsg}));
            };
            
            SvcSourceSelectionService.selectedServiceSourceModel(successCallback, failureCallback);
        });

        /*
         * When the selected table changes
         */
        $scope.$on('selectedTableChanged', function (event) {
           	vm.initialSourceTableName = null;
        });

        // Gets the available service sources
        vm.getSvcSources = function() {
            return vm.svcSources;
        };

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
         * Can the service be saved
         */
        vm.canSaveDataService = function() {
            if (angular.isUndefined(vm.serviceName) ||
                vm.serviceName === null || vm.serviceName === SYNTAX.EMPTY_STRING)
                return false;

            // Ok if initialSourceName and TableName are set
            if(vm.initialSourceName !== null && vm.initialSourceTableName !== null) {
                return true;
            }

            // Otherwise ensure source and table selections
            var selectedSrc = SvcSourceSelectionService.selectedServiceSource();
            if(selectedSrc===null) {
                return false;
            }

            var selTableName = TableSelectionService.selectedTable();
            if(selTableName === null) return false;

            return true;
        };

        // Event handler for clicking the save button
        vm.onSaveDataServiceClicked = function ( ) {
            if (! vm.canSaveDataService())
                return;
            
            try {
                RepoRestService.updateDataService( vm.serviceName, vm.serviceDescription ).then(
                    function () {
                        setDataserviceServiceVdb(vm.serviceName);
                    },
                    function (response) {
                        throw RepoRestService.newRestException($translate.instant('dsEditController.saveFailedMsg', 
                                                                                  {response: RepoRestService.responseMessage(response)}));
                    });
            } catch (error) {} finally {
            }
        };
        
        // Event handler for clicking the save button
        //   - generate the data service using selections
        //   - delete 'scratch' models when done
        function setDataserviceServiceVdb( dataserviceName ) {
            // Gets the VDB / Model / Table selections
            var selectedSrc = SvcSourceSelectionService.selectedServiceSource();
            var selSvcSourceName = selectedSrc.keng__id;
            
            // Gets selected model name, create the dataservice VDB
            var successCallback = function(model) {
            	var selSvcSourceModelName = model.keng__id;
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
                            throw RepoRestService.newRestException($translate.instant('dsEditController.saveFailedMsg', 
                                                                                      {response: RepoRestService.responseMessage(response)}));
                        });
                } catch (error) {} finally {
                }
            };

            var failureCallback = function(errorMsg) {
                alert($translate.instant('shared.changedConnectionFailedMsg', {errorMsg: errorMsg}));
            };
            
            SvcSourceSelectionService.selectedServiceSourceModel(successCallback, failureCallback);
        }
    }
    
})();
