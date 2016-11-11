(function () {
    'use strict';

    var pluginName = 'vdb-bench.dataservice';
    var pluginDirName = 'vdb-bench-dataservice';

    angular
        .module(pluginName)
        .controller('DSSummaryController', DSSummaryController);

    DSSummaryController.$inject = ['$scope', '$rootScope', 'RepoRestService', 'REST_URI', 'SYNTAX', 'DSSelectionService', 'SvcSourceSelectionService', 'DownloadService', 'pfViewUtils'];

    function DSSummaryController($scope, $rootScope, RepoRestService, REST_URI, SYNTAX, DSSelectionService, SvcSourceSelectionService, DownloadService, pfViewUtils) {
        var vm = this;

        vm.dsLoading = DSSelectionService.isLoading();
        vm.sourcesLoading = SvcSourceSelectionService.isLoading();
        vm.hasSources = false;
        vm.hasServices = false;
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
                vm.refreshServices();
           } else {
                vm.hasServices = false;
           }
        });
        
        /*
         * When the service sources have been loaded
         */
        $scope.$on('loadingServiceSourcesChanged', function (event, loading) {
            vm.sourcesLoading = loading;
            if(vm.sourcesLoading === false) {
                vm.refreshSourceState();
            } else {
                vm.hasSources = false;
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

        /**
         * Manage DataSources button click
         */
        vm.manageDataSources = function() {
            SvcSourceSelectionService.refresh('datasource-summary');
        };

        /**
         * Create New Service click
         */
        vm.createNewService = function() {
            SvcSourceSelectionService.refresh('dataservice-new');
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
          views: [pfViewUtils.getListView()], // Only using list view for the moment
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
                        throw RepoRestService.newRestException("Failed to remove the dataservice. \n" + RepoRestService.responseMessage(response));
                    });
            } catch (error) {} finally {
            }

            // Disable the actions until next selection
            setActionsDisabled(true);
        };

        /**
         * Handle delete dataservice menu select
         */
        var deleteDataServiceMenuAction = function(action, item) {
            // Need to select the item first
            DSSelectionService.selectDataService(item);

            deleteDataServiceClicked();
        };

        /**
         * Handle deploy dataservice click
         */
        var deployDataServiceClicked = function ( ) {
            var selDS = DSSelectionService.selectedDataService();
            var selDSName = selDS.keng__id;
            var dsVdbName = DSSelectionService.selectedDataServiceVdbName();

            DSSelectionService.setDeploying(true, selDSName, false, null);
            try {
                RepoRestService.deployDataService( selDSName ).then(
                    function ( result ) {
                        vm.deploymentSuccess = result.Information.deploymentSuccess == "true";
                        if(vm.deploymentSuccess === true) {

                            var successCallback = function() {
                                DSSelectionService.setDeploying(false, selDSName, true, null);
                            };
                            var failCallback = function(failMessage) {
                                DSSelectionService.setDeploying(false, selDSName, false, failMessage);
                            };

                            //
                            // Monitor the service vdb of the dataservice to determine when its active
                            //
                            RepoRestService.pollForActiveVdb(dsVdbName, successCallback, failCallback);

                        } else {
                            DSSelectionService.setDeploying(false, selDSName, false, result.Information.ErrorMessage1);
                        }
                   },
                    function (response) {
                        DSSelectionService.setDeploying(false, selDSName, false, RepoRestService.responseMessage(response));
                        throw RepoRestService.newRestException("Failed to deploy the dataservice. \n" + RepoRestService.responseMessage(response));
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
         * Handle edit dataservice menu select
         */
        var deployDataServiceMenuAction = function(action, item) {
            // Need to select the item first
            DSSelectionService.selectDataService(item);

            deployDataServiceClicked();
        };
        
        /**
         * Handle edit dataservice click
         */
        var editDataServiceClicked = function( ) {
            // Updates the selections first
            var selDSName = DSSelectionService.selectedDataService().keng__id;
            updateServiceEditSelections(selDSName);
        };

        /**
         * Initialize the source and table selections for the dataservice
         */
        function updateServiceEditSelections ( dataServiceName ) {
            // Gets the teiid model schema.  If successful, create a temp model using the schema
            try {
                RepoRestService.getWkspSourceVdbsForDataService( dataServiceName ).then(
                    function ( result ) {
                        var vdbsLength = result.length;
                        for (var i = 0; i < vdbsLength; i++) {
                            var srcName = result[i].keng__id;
                            DSSelectionService.setEditSourceSelection(srcName);
                        }
                        initTableSelections( dataServiceName );
                    },
                    function (response) {
                        throw RepoRestService.newRestException("Failed to find source VDBs. \n" + RepoRestService.responseMessage(response));
                    });
            } catch (error) {
            } finally {
            }
        }

        /**
         * Initialize the source and table selections for the dataservice
         */
        function initTableSelections ( dataServiceName ) {
            // Gets the teiid model schema.  If successful, create a temp model using the schema
            try {
                RepoRestService.getTableNamesForDataService( dataServiceName ).then(
                    function ( result ) {
                        var tableName = result.Information.SourceTable1;
                        DSSelectionService.setEditSourceTableSelection(tableName);
                        
                        // Start refresh of Service Sources, changing to edit page
                        SvcSourceSelectionService.refresh('dataservice-edit');
                    },
                    function (response) {
                        throw RepoRestService.newRestException("Failed to find view tables. \n" + RepoRestService.responseMessage(response));
                    });
            } catch (error) {
            } finally {
            }
        }
        
        /*
         * Edit a dataservice
         */
        vm.editDataService = function(item) {
            // Need to select the item first
            DSSelectionService.selectDataService(item);

            editDataServiceClicked(); 
        };

        /**
         * Handle edit dataservice menu select
         */
        var editDataServiceMenuAction = function(action, item) {
            vm.editDataService(item);
        };

        /**
         * Handle clone dataservice click
         */
        var cloneDataServiceClicked = function( ) {
            // Broadcast the pageChange
            $rootScope.$broadcast("dataServicePageChanged", 'dataservice-clone');
        };

        /**
         * Handle clone dataservice menu select
         */
        var cloneDataServiceMenuAction = function(action, item) {
            // Need to select the item first
            DSSelectionService.selectDataService(item);

            cloneDataServiceClicked();
        };

        /**
         * Handle new dataservice click
         */
        var newDataServiceClicked = function( ) {
            // Start refresh of Service Sources, changing to new page
            SvcSourceSelectionService.refresh('dataservice-new');
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
         * Handle export dataservice menu select
         */
        var exportDataServiceMenuAction = function(action, item) {
            // Need to select the item first
            DSSelectionService.selectDataService(item);

            exportDataServiceClicked();
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
              name: 'New',
              title: 'Create a Dataservice',
              actionFn: newDataServiceClicked,
              isDisabled: false
            },
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
              name: 'Import',
              title: 'Import a Dataservice',
              actionFn: importDataServiceClicked,
              isDisabled: false
            }
          ],
          actionsInclude: true
        };

        vm.menuActions = [
            {
                name: 'Edit',
                title: 'Edit the Dataservice',
                actionFn: editDataServiceMenuAction
            },
            {
                name: 'Test',
                title: 'Test the Dataservice',
                actionFn: deployDataServiceMenuAction
            },
            {
                name: 'Delete',
                title: 'Delete the Dataservice',
                actionFn: deleteDataServiceMenuAction
            },
            {
                name: 'Export',
                title: 'Export the Dataservice',
                actionFn: exportDataServiceMenuAction
            },
            {
                name: 'Copy',
                title: 'Copy the Dataservice',
                actionFn: cloneDataServiceMenuAction
            }
          ];

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
        vm.refreshServices = function() {
            vm.allItems = DSSelectionService.getDataServices();
            vm.items = vm.allItems;
            vm.filterConfig.resultsCount = vm.items.length;
            vm.hasServices = vm.allItems.length>0;
        };
        
        /**
         * Refresh the source state
         */
        vm.refreshSourceState = function() {
        	vm.hasSources = SvcSourceSelectionService.getServiceSources().length>0;
        };

        vm.refreshServices();
        vm.refreshSourceState();
        setActionsDisabled(true);
    }

})();
