(function () {
    'use strict';

    var pluginName = 'vdb-bench.widgets';
    var pluginDirName = 'vdb-bench-widgets';

    angular
        .module(pluginName)
        .directive('modelTableList', ModelTableList);

    ModelTableList.$inject = ['CONFIG', 'SYNTAX'];
    ModelTableListController.$inject = ['$scope', '$rootScope', '$translate', 'RepoRestService', 'REST_URI', 'SYNTAX', 
                                        'SvcSourceSelectionService', 'TableSelectionService', 'pfViewUtils'];

    function ModelTableList(config, syntax) {
        var directive = {
            restrict: 'E',
            scope: {},
            bindToController: {
                selection : '@'
            },
            controller: ModelTableListController,
            controllerAs: 'vm',
            templateUrl: config.pluginDir + syntax.FORWARD_SLASH +
                pluginDirName + syntax.FORWARD_SLASH +
                'modelTableList.html'
        };

        return directive;
    }

    function ModelTableListController($scope, $rootScope, $translate, RepoRestService, REST_URI, SYNTAX, 
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
            var vdbName = selectedSource.keng__id;
            
            var successCallback = function(model) {
                // Update the items using the specified vdb model
                try {
                    RepoRestService.getVdbModelTables( vdbName, model.keng__id ).then(
                        function ( result ) {
                            vm.allItems = result;
                            vm.items = vm.allItems;
                            setSelection();
                            vm.tablesLoading = false;
                       },
                        function (response) {
                            vm.tablesLoading = false;
                        	var msg = $translate.instant('modelTableList.getTablesErrorMsg', 
                                                         {errorMsg: RepoRestService.responseMessage(response)});
                            throw RepoRestService.newRestException(msg);
                        });
                } catch (error) {} finally {
                }
            };

            var failureCallback = function(errorMsg) {
            	alert($translate.instant('modelTableList.connectionFailedErrorMsg', {error: errorMsg}));
            };
            
            SvcSourceSelectionService.selectedServiceSourceModel(successCallback,failureCallback);
        });

        function setSelection() {
            // Selection if specified
            var selItems = [];
            if(vm.selection !== null) {
            	// See if item match
                var itemsLength = vm.items.length;
                for (var i = 0; i < itemsLength; i++) {
                	if(vm.items[i].keng__id==vm.selection) {
                		selItems.push(vm.items[i]);
                        break;
                	}
                } 
            }
            vm.listConfig.selectedItems = selItems;
        }
        
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
