(function () {
    'use strict';

    var pluginName = 'vdb-bench.widgets';
    var pluginDirName = 'vdb-bench-widgets';

    angular
        .module(pluginName)
        .directive('connectionList', ConnectionList);

    ConnectionList.$inject = ['CONFIG', 'SYNTAX'];
    ConnectionListController.$inject = ['$scope', '$rootScope', 'RepoRestService', 'REST_URI', 'SYNTAX', 
                                        'ConnectionSelectionService', 'pfViewUtils'];

    function ConnectionList(config, syntax) {
        var directive = {
            restrict: 'E',
            scope: {},
            bindToController: {
                selection : '@'
            },
            controller: ConnectionListController,
            controllerAs: 'vm',
            templateUrl: config.pluginDir + syntax.FORWARD_SLASH +
                pluginDirName + syntax.FORWARD_SLASH +
                'connectionList.html'
        };

        return directive;
    }

    function ConnectionListController($scope, $rootScope, RepoRestService, REST_URI, SYNTAX, 
                                      ConnectionSelectionService, pfViewUtils) {
        var vm = this;

        vm.connectionsLoading = ConnectionSelectionService.isLoading();
        vm.allItems = null;
        vm.items = null;

        /*
         * Notification when connection loading status has changed
         */
        $scope.$on('loadingConnectionsChanged', function (event, loading) {
            vm.connectionsLoading = loading;
            if(vm.connectionsLoading === false) {
                vm.allItems = ConnectionSelectionService.getConnections();
                vm.items = vm.allItems;
            }
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
         * Access to the collection of filtered connections
         */
        vm.getConnections = function() {
            return vm.items;
        };

        /**
         * Access to the collection of filtered connections
         */
        vm.getAllConnections = function() {
            return vm.allItems;
        };
     
        /** 
         * Handle row selection
         */
        var handleSelect = function (item, e) {
            var itemsSelected = vm.listConfig.selectedItems;
            if(itemsSelected.length === 0) {
                ConnectionSelectionService.selectConnection(null);
            } else {
                ConnectionSelectionService.selectConnection(item);
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
        
        /**
         * Refresh the list contents and selection
         */
        vm.refresh = function() {
            vm.allItems = ConnectionSelectionService.getConnections();
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
                ConnectionSelectionService.selectConnection(selItems[0]);
            }
        };

        vm.refresh();
        
    }
})();
