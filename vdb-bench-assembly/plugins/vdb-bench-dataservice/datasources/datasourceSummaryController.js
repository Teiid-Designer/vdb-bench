(function () {
    'use strict';

    var pluginName = 'vdb-bench.dataservice';
    var pluginDirName = 'vdb-bench-dataservice';

    angular
        .module(pluginName)
        .controller('DatasourceSummaryController', DatasourceSummaryController);

    DatasourceSummaryController.$inject = ['$scope', '$rootScope', 'RepoRestService', 'REST_URI', 'SYNTAX', 
                                           'SvcSourceSelectionService', 'DownloadService', 'pfViewUtils'];

    function DatasourceSummaryController($scope, $rootScope, RepoRestService, REST_URI, SYNTAX, 
                                          SvcSourceSelectionService, DownloadService, pfViewUtils) {
        var vm = this;

        vm.srcLoading = SvcSourceSelectionService.isLoading();
        vm.deploymentSuccess = false;
        vm.deploymentMessage = null;
        vm.allItems = SvcSourceSelectionService.getServiceSources();
        vm.items = vm.allItems;
        vm.selectedSourceDDL = "";
        vm.deleteVdbInProgress = false;
        vm.displayDdl = false; // Do not display by default

        /**
         * Options for the codemirror editor used for previewing ddl
         */
        vm.ddlEditorOptions = {
            lineWrapping: true,
            lineNumbers: true,
            mode: 'text/x-sql'
        };

        vm.ddlEditorLoaded = function(_editor) {
            // Nothing to do at the moment
        };

        /*
         * When the data services have been loaded
         */
        $scope.$on('loadingServiceSourcesChanged', function (event, loading) {
            vm.srcLoading = loading;
            if(vm.srcLoading === false) {
                vm.allItems = SvcSourceSelectionService.getServiceSources();
                vm.items = vm.allItems;
                vm.filterConfig.resultsCount = vm.items.length;
                vm.deleteVdbInProgress = false;
           }
        });

        /**
         * Set the ddl for the selected service source
         */
        function setDDL() {
            vm.selectedSourceDDL = '';

            if (! vm.displayDdl)
                return;

            if (_.isEmpty(SvcSourceSelectionService.selectedServiceSource()))
                return;

            vm.selectedSourceDDL = 'Fetching DDL ...';

            var vdbName = SvcSourceSelectionService.selectedServiceSource().keng__id;

            var schemaSuccessCallback = function(modelName) {
                try {
                    RepoRestService.getTeiidVdbModelSchema( vdbName, modelName ).then(
                        function ( result ) {
                            vm.selectedSourceDDL = result.Information.schema;
                        },
                        function (response) {
                            vm.selectedSourceDDL = "Failed to get the DDL. \n" + RepoRestService.responseMessage(response);
                        });
                } catch (error) {
                    vm.selectedSourceDDL = "Failed to get the DDL. \n" + error;
                }
            };

            var failureCallback = function(errorMsg) {
                vm.selectedSourceDDL = "Failed to get the DDL. \n" + errorMsg;
            };

            SvcSourceSelectionService.selectedServiceSourceConnectionName(schemaSuccessCallback, failureCallback);
        }

        /** 
         * Sets disabled state of all ServiceSource actions
         */
        function setActionsDisabled(enabled) {
            vm.actionsConfig.primaryActions.forEach(function (theAction) {
                if(theAction.name!=='New' && theAction.name!='Import') {
                    theAction.isDisabled = enabled;
                }
            });
            vm.actionsConfig.moreActions.forEach(function (theAction) {
                if(theAction.name!=='New' && theAction.name!=='Import' && theAction.name!=='Display DDL') {
                    theAction.isDisabled = enabled;
                }
            });
        }

        /*
         * When the selected service source changed
         */
        $scope.$on('selectedServiceSourceChanged', function (event, loading) {
            // Check selection or deSelection.  If nothing selected, clear the DDL
            var itemsSelected = vm.listConfig.selectedItems;
            if(itemsSelected.length === 0) {
                vm.selectedSourceDDL = "";
                return;
            }

            // Set the DDL for the selected item
            setDDL();
        });

                /**
         * Delete the specified VDB from the server
         */
        function deleteServerVdb(vdbName) {
            try {
                RepoRestService.deleteTeiidVdb( vdbName ).then(
                    function () {
                         // Refresh the list of service sources
                        SvcSourceSelectionService.refresh(null);
                        vm.refresh();
                        // Disable the actions until next selection
                        setActionsDisabled(true);
                        vm.selectedSourceDDL = "";
                    },
                    function (response) {
                        throw RepoRestService.newRestException("Failed to remove the ServiceSource. \n" + RepoRestService.responseMessage(response));
                    });
            } catch (error) {
                throw RepoRestService.newRestException("Failed to remove the ServiceSource. \n" + error);
            }
        }

        /**
         * Delete the specified VDB from the workspace, then delete the server vdb (if it exists)
         */
        function deleteVdb(vdbName) {
           // Set loading true for modal popup
           vm.deleteVdbInProgress = true;
           SvcSourceSelectionService.setLoading(true);
           try {
                RepoRestService.deleteVdb( vdbName ).then(
                    function () {
                        deleteServerVdb(vdbName);
                    },
                    function (response) {
                        throw RepoRestService.newRestException("Failed to remove the ServiceSource. \n" + RepoRestService.responseMessage(response));
                    });
            } catch (error) {} finally {
            }
        }

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

        var matchesFilter = function (item, filter) {
          var match = true;
     
          if (filter.id === 'name') {
              if(item.keng__id !== null) {
                  match = item.keng__id.match(filter.value) !== null;
              }
          } else if (filter.id === 'description') {
              if(item.vdb__description !== null) {
                  match = item.vdb__description.match(filter.value) !== null;
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
              if(!item1.vdb__description) {
                  compValue = -1;
              } else if(!item2.vdb__description) {
                  compValue = 1;
              } else {
                  compValue = item1.vdb__description.localeCompare(item2.vdb__description);
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
         * Handle delete ServiceSource click.
         * 1) delete the vdb from the repo
         * 2) undeploy the vdb from the server
         */
        var deleteSvcSourceClicked = function ( ) {
            var selVdbName = SvcSourceSelectionService.selectedServiceSource().keng__id;

            // Deletes the workspace and server vdb (if exists).  Also does a refresh when complete
            deleteVdb(selVdbName);
        };

        /**
         * Handle delete ServiceSource menu select
         */
        var deleteSvcSourceMenuAction = function(action, item) {
            // Need to select the item first
            SvcSourceSelectionService.selectServiceSource(item);

            deleteSvcSourceClicked();
        };
 
        /**
         * Handle export ServiceSource click
         */
        var exportSvcSourceClicked = function( ) {
            try {
                DownloadService.download(SvcSourceSelectionService.selectedServiceSource());
            } catch (error) {} finally {
            }
        };

        /**
         * Handle export ServiceSource menu select
         */
        var exportSvcSourceMenuAction = function(action, item) {
            // Need to select the item first
            SvcSourceSelectionService.selectServiceSource(item);

            exportSvcSourceClicked();
        };

        /**
         * Handle edit ServiceSource click
         */
        var editSvcSourceClicked = function( ) {
            // Start refresh of Connections and Translators, then broadcast a page change
            SvcSourceSelectionService.refreshConnectionsAndTranslators();
            //
            // Broadcast the pageChange
            $rootScope.$broadcast("dataServicePageChanged", 'svcsource-edit');
        };

        /**
         * Handle edit ServiceSource menu select
         */
        var editSvcSourceMenuAction = function(action, item) {
            // Need to select the item first
            SvcSourceSelectionService.selectServiceSource(item);

            editSvcSourceClicked();
        };

        /**
         * Handle clone ServiceSource click
         */
        var cloneSvcSourceClicked = function( ) {
            // Broadcast the pageChange
            $rootScope.$broadcast("dataServicePageChanged", 'svcsource-clone');
        };

        /**
         * Handle clone ServiceSource menu select
         */
        var cloneSvcSourceMenuAction = function(action, item) {
            // Need to select the item first
            SvcSourceSelectionService.selectServiceSource(item);

            cloneSvcSourceClicked();
        };

        /**
         * Handle new ServiceSource click
         */
        var newSvcSourceClicked = function( ) {
            // Start refresh of Connections and Translators, then broadcast a page change
            SvcSourceSelectionService.refreshConnectionsAndTranslators();
            //
            // Broadcast the pageChange
            $rootScope.$broadcast("dataServicePageChanged", 'svcsource-new');
        };
        
        /**
         * Handle import ServiceSource click
         */
        var importSvcSourceClicked = function( ) {
            // Broadcast the pageChange
            $rootScope.$broadcast("dataServicePageChanged", 'svcsource-import');
        };

        /**
         * Toggle the displaying of the DDL window
         */
        var showHideDDLClicked = function() {
            vm.displayDdl = ! vm.displayDdl;
            setDDL();
        };

        /** 
         * Handle listView and cardView selection
         */
        var handleSelect = function (item, e) {
            SvcSourceSelectionService.selectServiceSource(item);
            
            // Actions disabled unless one is selected
            var itemsSelected = vm.listConfig.selectedItems;
            if(itemsSelected.length === 0) {
                setActionsDisabled(true);
            } else {
                setActionsDisabled(false);
            }
        };  

        /**
         * ServiceSource Actions
         */
        vm.actionsConfig = {
          primaryActions: [
            {
              name: 'Edit',
              title: 'Edit the ServiceSource',
              actionFn: editSvcSourceClicked,
              isDisabled: true
            },
            {
              name: 'Delete',
              title: 'Delete the ServiceSource',
              actionFn: deleteSvcSourceClicked,
              isDisabled: true
            }
          ],
          moreActions: [
            {
              name: 'Export',
              title: 'Export the ServiceSource',
              actionFn: exportSvcSourceClicked,
              isDisabled: true
            },
            {
              name: 'Copy',
              title: 'Copy the ServiceSource',
              actionFn: cloneSvcSourceClicked,
              isDisabled: true
            },
            {
              isSeparator: true
            },
            {
              name: 'New',
              title: 'Create a ServiceSource',
              actionFn: newSvcSourceClicked,
              isDisabled: false
            },
            {
              name: 'Import',
              title: 'Import a ServiceSource',
              actionFn: importSvcSourceClicked,
              isDisabled: false
            },
            {
              isSeparator: true
            },
            {
              name: 'Display DDL',
              title: 'Show / Hide the DDL window',
              actionFn: showHideDDLClicked,
              isDisabled: false
            }
          ],
          actionsInclude: true
        };

        vm.menuActions = [
            {
                name: 'Edit',
                title: 'Edit the Service-source',
                actionFn: editSvcSourceMenuAction
            },
            {
                name: 'Delete',
                title: 'Delete the Service-source',
                actionFn: deleteSvcSourceMenuAction
            },
            {
                name: 'Export',
                title: 'Export the Service-source',
                actionFn: exportSvcSourceMenuAction
            },
            {
                name: 'Copy',
                title: 'Copy the Service-source',
                actionFn: cloneSvcSourceMenuAction
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
        vm.refresh = function() {
            vm.allItems = SvcSourceSelectionService.getServiceSources();
            vm.items = vm.allItems;
            vm.filterConfig.resultsCount = vm.items.length;
        };

        vm.refresh();
        setActionsDisabled(true);

    }

})();
