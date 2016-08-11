(function () {
    'use strict';

    var pluginName = 'vdb-bench.dataservice';
    var pluginDirName = 'vdb-bench-dataservice';

    angular
        .module(pluginName)
        .controller('DSSummaryController', DSSummaryController);

    DSSummaryController.$inject = ['$scope', '$rootScope', 'RepoRestService', 'REST_URI', 'SYNTAX', 'DSSelectionService', 'DownloadService', 'pfViewUtils'];

    function DSSummaryController($scope, $rootScope, RepoRestService, REST_URI, SYNTAX, DSSelectionService, DownloadService, pfViewUtils) {
        var vm = this;

        vm.dsLoading = DSSelectionService.isLoading();
        vm.deploymentSuccess = false;
        vm.deploymentMessage = null;
        vm.allItems = DSSelectionService.getDataServices();
        vm.items = vm.allItems;

        /*
         * When the data services have been loaded
         */
        $scope.$on('loadingDataServicesChanged', function (event, loading) {
            vm.dsLoading = loading;
            if(vm.dsLoading === false) {
                vm.allItems = DSSelectionService.getDataServices();
                vm.items = vm.allItems;
                vm.filterConfig.resultsCount = vm.items.length;
           }
        });

        /**
         * Access to the collection of filtered data services
         */
        vm.getDataServices = function() {
            return vm.items;
        };

        /**
         * Access to the collection of filtered data services
         */
        vm.getAllDataServices = function() {
            return vm.allItems;
        };

        var matchesFilter = function (item, filter) {
          var match = true;
     
          if (filter.id === 'name') {
              if(item.keng__id !== null) {
                  match = item.keng__id.match(filter.value) !== null;
              }
          } else if (filter.id === 'description') {
              if(item.tko__description !== null) {
                  match = item.tko__description.match(filter.value) !== null;
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
            },
            {
              id: 'description',
              title:  'Description',
              placeholder: 'Filter by Description...',
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
          } else if (vm.sortConfig.currentField.id === 'description') {
              if(!item1.tko__description) {
                  compValue = -1;
              } else if(!item2.tko__description) {
                  compValue = 1;
              } else {
                  compValue = item1.tko__description.localeCompare(item2.tko__description);
              }
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
            },
            {
              id: 'description',
              title:  'Description',
              sortType: 'alpha'
            }
          ],
          onSortChange: sortChange
        };
     
        /**
         * Handle delete dataservice click
         */
        var deleteDataServiceClicked = function ( ) {
            var selDSName = DSSelectionService.selectedDataService().keng__id;
            try {
                RepoRestService.deleteDataService( selDSName ).then(
                    function () {
                        // Refresh the list of data services
                        DSSelectionService.refresh();
                    },
                    function (response) {
                        throw RepoRestService.newRestException("Failed to remove the dataservice. \n" + response.message);
                    });
            } catch (error) {} finally {
            }
            vm.refresh();
            // Disable the actions until next selection
            setActionsDisabled(true);
        };

        /**
         * Handle deploy dataservice click
         */
        var deployDataServiceClicked = function ( ) {
            var selDSName = DSSelectionService.selectedDataService().keng__id;
            DSSelectionService.setDeploying(true, selDSName, false, null);
            try {
                RepoRestService.deployDataService( selDSName ).then(
                    function ( result ) {
                        vm.deploymentSuccess = result.Information.deploymentSuccess == "true";
                        if(vm.deploymentSuccess === true) {
                            DSSelectionService.setDeploying(false, selDSName, true, null);
                        } else {
                            DSSelectionService.setDeploying(false, selDSName, false, result.Information.ErrorMessage1);
                        }
                   },
                    function (response) {
                        DSSelectionService.setDeploying(false, selDSName, false, response.message);
                        throw RepoRestService.newRestException("Failed to deploy the dataservice. \n" + response.message);
                    });
            } catch (error) {} finally {
                vm.deploymentSuccess = false;
                vm.deploymentMessage = null;
                DSSelectionService.setDeploying(false);
            }

            // Broadcast the pageChange
            $rootScope.$broadcast("dataServicePageChanged", 'dataservice-test');
        };
        
        /**
         * Handle edit dataservice click
         */
        var editDataServiceClicked = function( ) {
            // Broadcast the pageChange
            $rootScope.$broadcast("dataServicePageChanged", 'dataservice-edit');
        };

        /**
         * Handle clone dataservice click
         */
        var cloneDataServiceClicked = function( ) {
            // Broadcast the pageChange
            $rootScope.$broadcast("dataServicePageChanged", 'dataservice-clone');
        };

        /**
         * Handle new dataservice click
         */
        var newDataServiceClicked = function( ) {
            // Broadcast the pageChange
            $rootScope.$broadcast("dataServicePageChanged", 'dataservice-new');
        };
        
        /**
         * Handle import dataservice click
         */
        var importDataServiceClicked = function( ) {
            // Broadcast the pageChange
            $rootScope.$broadcast("dataServicePageChanged", 'dataservice-import');
        };

        /**
         * Handle export dataservice click
         */
        var exportDataServiceClicked = function( ) {
            // Broadcast the pageChange
            $rootScope.$broadcast("dataServicePageChanged", 'dataservice-export');
        };

        /** 
         * Handle listView and cardView selection
         */
        var handleSelect = function (item, e) {
            DSSelectionService.selectDataService(item);
            
            // Actions disabled unless one is selected
            var itemsSelected = vm.listConfig.selectedItems;
            if(itemsSelected.length === 0) {
                setActionsDisabled(true);
            } else {
                setActionsDisabled(false);
            }
        };  
        
        /** 
         * Sets disabled state of all dataservice actions
         */
        var setActionsDisabled = function (enabled) {
            vm.actionsConfig.primaryActions.forEach(function (theAction) {
                if(theAction.name!=='New' && theAction.name!='Import') {
                    theAction.isDisabled = enabled;
                }
            });
            vm.actionsConfig.moreActions.forEach(function (theAction) {
                if(theAction.name!=='New' && theAction.name!='Import') {
                    theAction.isDisabled = enabled;
                }
            });
        };   
        
        /**
         * Dataservice Actions
         */
       vm.actionsConfig = {
          primaryActions: [
            {
              name: 'Edit',
              title: 'Edit the Dataservice',
              actionFn: editDataServiceClicked,
              isDisabled: true
            },
            {
              name: 'Test',
              title: 'Test the Dataservice',
              actionFn: deployDataServiceClicked,
              isDisabled: true
            },
            {
              name: 'Delete',
              title: 'Delete the Dataservice',
              actionFn: deleteDataServiceClicked,
              isDisabled: true
            }
          ],
          moreActions: [
            {
              name: 'Export',
              title: 'Export the Dataservice',
              actionFn: exportDataServiceClicked,
              isDisabled: true
            },
            {
              name: 'Copy',
              title: 'Copy the Dataservice',
              actionFn: cloneDataServiceClicked,
              isDisabled: true
            },
            {
              isSeparator: true
            },
            {
              name: 'New',
              title: 'Create a Dataservice',
              actionFn: newDataServiceClicked,
              isDisabled: false
            },
            {
              name: 'Import',
              title: 'Import a Dataservice',
              actionFn: importDataServiceClicked,
              isDisabled: false
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
         * Access to the collection of data services
         */
        vm.refresh = function() {
            vm.allItems = DSSelectionService.getDataServices();
            vm.items = vm.allItems;
            vm.filterConfig.resultsCount = vm.items.length;
        };

        vm.refresh();
        setActionsDisabled(true);
    }

})();
