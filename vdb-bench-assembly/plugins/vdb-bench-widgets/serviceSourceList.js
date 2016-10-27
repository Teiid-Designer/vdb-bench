(function () {
    'use strict';

    var pluginName = 'vdb-bench.widgets';
    var pluginDirName = 'vdb-bench-widgets';

    angular
        .module(pluginName)
        .directive('serviceSourceList', ServiceSourceList);

    ServiceSourceList.$inject = ['CONFIG', 'SYNTAX'];
    ServiceSourceListController.$inject = ['$scope', '$rootScope', 'RepoRestService', 'REST_URI', 'SYNTAX', 
                                           'SvcSourceSelectionService', 'pfViewUtils'];

    function ServiceSourceList(config, syntax) {
        var directive = {
            restrict: 'E',
            scope: {},
            bindToController: {
                selection : '@'
            },
            controller: ServiceSourceListController,
            controllerAs: 'vm',
            templateUrl: config.pluginDir + syntax.FORWARD_SLASH +
                pluginDirName + syntax.FORWARD_SLASH +
                'serviceSourceList.html'
        };

        return directive;
    }

    function ServiceSourceListController($scope, $rootScope, RepoRestService, REST_URI, SYNTAX, 
                                          SvcSourceSelectionService, pfViewUtils) {
        var vm = this;

        vm.srcLoading = SvcSourceSelectionService.isLoading();
        vm.allItems = SvcSourceSelectionService.getServiceSources();
        vm.items = vm.allItems;

        /*
         * When the data services have been loaded
         */
        $scope.$on('loadingServiceSourcesChanged', function (event, loading) {
            vm.srcLoading = loading;
            if(vm.srcLoading === false) {
                vm.allItems = SvcSourceSelectionService.getServiceSources();
                vm.items = vm.allItems;
            }
        });

        /**
         * Access to the collection of filtered data services
         */
        vm.getServiceSources = function() {
            return vm.items;
        };

        /**
         * Access to the collection of filtered data services
         */
        vm.getAllServiceSources = function() {
            return vm.allItems;
        };
     
        /** 
         * Handle row selection
         */
        var handleSelect = function (item, e) {
            var itemsSelected = vm.listConfig.selectedItems;
            if(itemsSelected.length === 0) {
                SvcSourceSelectionService.selectServiceSource(null);
            } else {
                SvcSourceSelectionService.selectServiceSource(item);
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
          checkDisabled: false,
          selectedItems: {}
        };
        
        /**
         * Access to the collection of data services
         */
        vm.refresh = function() {
            vm.allItems = SvcSourceSelectionService.getServiceSources();
            vm.items = vm.allItems;
            
            // Set the selection (if specified)
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
            if(selItems.length==1) {
                vm.listConfig.selectedItems = selItems;
                SvcSourceSelectionService.selectServiceSource(selItems[0]);
            }
        };

        vm.refresh();
    }
})();
