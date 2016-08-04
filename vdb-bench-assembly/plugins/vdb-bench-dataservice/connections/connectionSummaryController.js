(function () {
    'use strict';

    var pluginName = 'vdb-bench.dataservice';
    var pluginDirName = 'vdb-bench-dataservice';

    angular
        .module(pluginName)
        .controller('ConnectionSummaryController', ConnectionSummaryController);

    ConnectionSummaryController.$inject = ['$scope', '$rootScope', 'RepoRestService', 'REST_URI', 'SYNTAX', 'ConnectionSelectionService', 'DownloadService', 'pfViewUtils'];

    function ConnectionSummaryController($scope, $rootScope, RepoRestService, REST_URI, SYNTAX, ConnectionSelectionService, DownloadService, pfViewUtils) {
        var vm = this;

        vm.connLoading = ConnectionSelectionService.isLoading();
        vm.deploymentSuccess = false;
        vm.deploymentMessage = null;
        vm.allItems = ConnectionSelectionService.getConnections();
        vm.items = vm.allItems;

        /*
         * When the connections have been loaded
         */
        $scope.$on('loadingConnectionsChanged', function (event, loading) {
            vm.connLoading = loading;
            if(vm.connLoading === false) {
                vm.allItems = ConnectionSelectionService.getConnections();
                vm.items = vm.allItems;
                vm.filterConfig.resultsCount = vm.items.length;
           }
        });

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

        var matchesFilter = function (item, filter) {
          var match = true;
     
          if (filter.id === 'name') {
              if(item.keng__id !== null) {
                  match = item.keng__id.match(filter.value) !== null;
              }
          } 
          return match;
        };
     
        var matchesFilters = function (item, filters) {
          var matches = true;
     
          filters.forEach(function(filter) {
            if (!matchesFilter(item, filter)) {
              matches = false;
              return false;
            }
          });
          return matches;
        };
     
        var applyFilters = function (filters) {
          vm.items = [];
          if (filters && filters.length > 0) {
            vm.allItems.forEach(function (item) {
              if (matchesFilters(item, filters)) {
                vm.items.push(item);
              }
            });
          } else {
            vm.items = vm.allItems;
          }
        };
     
        var filterChange = function (filters) {
          applyFilters(filters);
          vm.toolbarConfig.filterConfig.resultsCount = vm.items.length;
        };
     
        vm.filterConfig = {
          fields: [
            {
              id: 'name',
              title:  'Name',
              placeholder: 'Filter by Name...',
              filterType: 'text'
            }
          ],
          resultsCount: vm.items.length,
          appliedFilters: [],
          onFilterChange: filterChange
        };
     
        var viewSelected = function(viewId) {
          vm.viewType = viewId;
        };
     
        vm.viewsConfig = {
          views: [pfViewUtils.getListView(), pfViewUtils.getCardView()],
          onViewSelect: viewSelected
        };
        vm.viewsConfig.currentView = vm.viewsConfig.views[0].id;
        vm.viewType = vm.viewsConfig.currentView;
     
        var compareFn = function(item1, item2) {
          var compValue = 0;
          if (vm.sortConfig.currentField.id === 'name') {
            compValue = item1.keng__id.localeCompare(item2.keng__id);
          }
     
          if (!vm.sortConfig.isAscending) {
            compValue = compValue * -1;
          }
     
          return compValue;
        };
     
        var sortChange = function (sortId, isAscending) {
          vm.items.sort(compareFn);
        };
     
        vm.sortConfig = {
          fields: [
            {
              id: 'name',
              title:  'Name',
              sortType: 'alpha'
            }
          ],
          onSortChange: sortChange
        };
     
        /**
         * Handle delete connection click
         */
        var deleteConnectionClicked = function ( ) {
            var selConnName = ConnectionSelectionService.selectedConnection().keng__id;
            try {
                RepoRestService.deleteDataSource( selConnName ).then(
                    function () {
                        // Refresh the list of connections
                        ConnectionSelectionService.refresh();
                    },
                    function (response) {
                        throw RepoRestService.newRestException("Failed to remove the connection. \n" + response.message);
                    });
            } catch (error) {} finally {
            }
            vm.refresh();
            // Disable the actions until next selection
            setActionsDisabled(true);
        };

        /**
         * Handle deploy connection click
         */
        var deployConnectionClicked = function ( ) {
            var selConnName = ConnectionSelectionService.selectedConnection().keng__id;
            ConnectionSelectionService.setDeploying(true, selConnName, false, null);
            try {
                RepoRestService.deployDataSource( selConnName ).then(
                    function ( result ) {
                        vm.deploymentSuccess = result.Information.deploymentSuccess == "true";
                        if(vm.deploymentSuccess === true) {
                            ConnectionSelectionService.setDeploying(false, selConnName, true, null);
                            alert("Connection Deployment Successful!");
                        } else {
                            ConnectionSelectionService.setDeploying(false, selConnName, false, result.Information.ErrorMessage1);
                            alert("Connection Deployment Failed!");
                        }
                   },
                    function (response) {
                        ConnectionSelectionService.setDeploying(false, selConnName, false, response.message);
                        throw RepoRestService.newRestException("Failed to deploy the connection. \n" + response.message);
                    });
            } catch (error) {} finally {
                vm.deploymentSuccess = false;
                vm.deploymentMessage = null;
                alert("Connection Deployment Failed!");
                ConnectionSelectionService.setDeploying(false);
            }
        };

        /**
         * Handle export connection click
         */
        var exportConnectionClicked = function( ) {
            try {
                DownloadService.download(ConnectionSelectionService.selectedConnection());
            } catch (error) {} finally {
            }
        };
        
        /**
         * Handle edit connection click
         */
        var editConnectionClicked = function( ) {
            // Broadcast the pageChange
            $rootScope.$broadcast("dataServicePageChanged", 'connection-edit');
        };

        /**
         * Handle clone connection click
         */
        var cloneConnectionClicked = function( ) {
            // Broadcast the pageChange
            $rootScope.$broadcast("dataServicePageChanged", 'connection-clone');
        };

        /**
         * Handle new connection click
         */
        var newConnectionClicked = function( ) {
            // Broadcast the pageChange
            $rootScope.$broadcast("dataServicePageChanged", 'connection-new');
        };
        
        /**
         * Handle import connection click
         */
        var importConnectionClicked = function( ) {
            // Broadcast the pageChange
            $rootScope.$broadcast("dataServicePageChanged", 'connection-import');
        };
        
        /** 
         * Handle listView and cardView selection
         */
        var handleSelect = function (item, e) {
            ConnectionSelectionService.selectConnection(item);
            
            // Actions disabled unless one is selected
            var itemsSelected = vm.listConfig.selectedItems;
            if(itemsSelected.length === 0) {
                setActionsDisabled(true);
            } else {
                setActionsDisabled(false);
            }
        };  
        
        /** 
         * Sets disabled state of all connection actions
         */
        var setActionsDisabled = function (enabled) {
            vm.actionsConfig.moreActions.forEach(function (theAction) {
                if(theAction.name!=='New' && theAction.name!='Import') {
                    theAction.isDisabled = enabled;
                }
            });
        };   
        
        /**
         * Connection Actions
         */
       vm.actionsConfig = {
          primaryActions: [
            {
              name: 'Edit',
              title: 'Edit the Connection',
              actionFn: editConnectionClicked,
              isDisabled: true
            },
            {
              name: 'Test',
              title: 'Test the Connection',
              actionFn: deployConnectionClicked,
              isDisabled: true
            },
            {
              name: 'Delete',
              title: 'Delete the Connection',
              actionFn: deleteConnectionClicked,
              isDisabled: true
            }
          ],
          moreActions: [
            {
              name: 'Export',
              title: 'Export the Connection',
              actionFn: exportConnectionClicked,
              isDisabled: true
            },
            {
              name: 'Copy',
              title: 'Copy the Connection',
              actionFn: cloneConnectionClicked,
              isDisabled: true
            },
            {
              isSeparator: true
            },
            {
              name: 'New',
              title: 'Create a Connection',
              actionFn: newConnectionClicked,
              isDisabled: false
            },
            {
              name: 'Import',
              title: 'Import a Connection',
              actionFn: importConnectionClicked,
              isDefined: false
            }
          ],
          actionsInclude: true
        };
     
        /**
         * Toolbar Configuration
         */
       vm.toolbarConfig = {
          viewsConfig: vm.viewsConfig,
          filterConfig: vm.filterConfig,
          sortConfig: vm.sortConfig,
          actionsConfig: vm.actionsConfig
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
         * Access to the collection of connections
         */
        vm.refresh = function() {
            vm.allItems = ConnectionSelectionService.getConnections();
            vm.items = vm.allItems;
            vm.filterConfig.resultsCount = vm.items.length;
        };

        vm.refresh();
        setActionsDisabled(true);

    }

})();
