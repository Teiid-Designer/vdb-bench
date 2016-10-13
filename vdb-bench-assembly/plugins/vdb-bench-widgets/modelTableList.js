(function () {
    'use strict';

    var pluginName = 'vdb-bench.widgets';
    var pluginDirName = 'vdb-bench-widgets';

    angular
        .module(pluginName)
        .directive('modelTableList', ModelTableList);

    ModelTableList.$inject = ['CONFIG', 'SYNTAX'];
    ModelTableListController.$inject = ['$scope', '$rootScope', 'RepoRestService', 'REST_URI', 'SYNTAX', 
                                        'SvcSourceSelectionService', 'TableSelectionService', 'pfViewUtils'];

    function ModelTableList(config, syntax) {
        var directive = {
            restrict: 'E',
            scope: {},
            controller: ModelTableListController,
            controllerAs: 'vm',
            templateUrl: config.pluginDir + syntax.FORWARD_SLASH +
                pluginDirName + syntax.FORWARD_SLASH +
                'modelTableList.html'
        };

        return directive;
    }

    function ModelTableListController($scope, $rootScope, RepoRestService, REST_URI, SYNTAX, 
                                      SvcSourceSelectionService, TableSelectionService, pfViewUtils) {
        var vm = this;

        vm.tablesLoading = false;
        vm.allItems = [];
        vm.items = vm.allItems;

        /*
         * When the data services have been loaded
         */
        $scope.$on('refreshModelTableList', function (event) {
            vm.tablesLoading = true;
            var selectedSource = SvcSourceSelectionService.selectedServiceSource();
            if(selectedSource === null) {
                vm.allItems = [];
                vm.items = [];
                vm.tablesLoading = false;
                return;
            }
            var tempVdbName = SYNTAX.TEMP+selectedSource.keng__id;
            
            var successCallback = function(modelName) {
                // Update the items using the Repo scratch object
                try {
                    RepoRestService.getVdbModelTables( tempVdbName, modelName ).then(
                        function ( result ) {
                            vm.allItems = result;
                            vm.items = vm.allItems;
                            vm.tablesLoading = false;
                       },
                        function (response) {
                            vm.tablesLoading = false;
                            throw RepoRestService.newRestException("Failed to get Tables. \n" + response.data.error);
                        });
                } catch (error) {} finally {
                }
            };

            var failureCallback = function(errorMsg) {
            	alert("Failed to get connection: \n"+errorMsg);
            };
            
            SvcSourceSelectionService.selectedServiceSourceConnectionName(successCallback,failureCallback);
        });

        /**
         * Access to the collection of filtered data services
         */
        vm.getTables = function() {
            return vm.items;
        };

        /**
         * Access to the collection of filtered data services
         */
        vm.getAllTables = function() {
            return vm.allItems;
        };
     
        /** 
         * Handle row selection
         */
        var handleSelect = function (item, e) {
            var itemsSelected = vm.listConfig.selectedItems;
            if(itemsSelected.length === 0) {
                TableSelectionService.selectTable(null);
            } else {
                TableSelectionService.selectTable(item);
            }
        };  
                
        /**
         * List and Card Configuration
         */
        vm.listConfig = {
          selectItems: true,
          showSelectBox: false,
          multiSelect: false,
          selectionMatchProp: 'keng__id',
          onSelect: handleSelect,
          checkDisabled: false
        };
        
    }
})();
