(function () {
    'use strict';

    var pluginName = 'vdb-bench.dataservice';
    var pluginDirName = 'vdb-bench-dataservice';

    angular
        .module(pluginName)
        .controller('DSSummaryController', DSSummaryController);

    DSSummaryController.$inject = ['$scope', '$rootScope', '$translate', 'RepoRestService', 'REST_URI', 'SYNTAX', 'DSPageService', 'ImportExportService',
                                   'EditWizardService', 'DSSelectionService', 'SvcSourceSelectionService', 'DownloadService', 'pfViewUtils'];

    function DSSummaryController($scope, $rootScope, $translate, RepoRestService, REST_URI, SYNTAX, DSPageService, ImportExportService,
                                 EditWizardService, DSSelectionService, SvcSourceSelectionService, DownloadService, pfViewUtils) {
        var vm = this;

        vm.dsLoading = DSSelectionService.isLoading();
        vm.sourcesLoading = SvcSourceSelectionService.isLoading();
        vm.hasSources = false;
        vm.hasServices = false;
        vm.allItems = DSSelectionService.getDataServices();
        vm.items = vm.allItems;
        vm.confirmDeleteMsg = "";
        vm.cannotEditMsg = "";
        vm.deleteServerVdb = true;

        function setHelpId() {
            var page = DSPageService.page(DSPageService.DATASERVICE_SUMMARY_PAGE);

            if (! vm.hasServices && ! vm.hasSources)
                DSPageService.setCustomHelpId(page.id, "dataservice-summary-empty");
            else if (! vm.hasServices && vm.hasSources)
                DSPageService.setCustomHelpId(page.id, "dataservice-summary-no-service");
            else
                DSPageService.setCustomHelpId(page.id, null);
        }

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

            setHelpId();
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

            setHelpId();
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
          var match = false;

          if (filter.id === 'name') {
              if( angular.isDefined(item.keng__id) && item.keng__id !== null ) {
                  match = item.keng__id.match(filter.value) !== null;
              }
          } else if (filter.id === 'description') {
              if( angular.isDefined(item.tko__description) && item.tko__description !== null ) {
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
              title: $translate.instant('shared.Name'),
              placeholder: $translate.instant('dsSummaryController.nameFilterPlaceholder'),
              filterType: 'text'
            },
            {
              id: 'description',
              title: $translate.instant('shared.Description'),
              placeholder: $translate.instant('dsSummaryController.descriptionFilterPlaceholder'),
              filterType: 'text'
            }
          ],
          resultsCount: vm.items.length,
          appliedFilters: [],
          onFilterChange: filterChange
        };

        vm.viewsConfig = {
            currentView: pfViewUtils.getListView().id
        };
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
              title: $translate.instant('shared.Name'),
              sortType: 'alpha'
            },
            {
              id: 'description',
              title: $translate.instant('shared.Description'),
              sortType: 'alpha'
            }
          ],
          onSortChange: sortChange
        };
     
        /**
         * Delete the selected data service
         */
        vm.deleteSelectedDataService = function( ) {
            var selDSName = DSSelectionService.selectedDataService().keng__id;
            var selDSVdbName = DSSelectionService.selectedDataServiceVdbName();

            // dismiss the delete confirmation modal
            $('#confirmDeleteModal').modal('hide');
            
            try {
                RepoRestService.deleteDataService( selDSName ).then(
                    function () {
                        if(vm.deleteServerVdb) {
                          try {
                              vm.dsLoading = true;
                              RepoRestService.deleteTeiidVdb( selDSVdbName ).then(
                              function () {
                                  // Refresh the list of data services
                                  DSSelectionService.refresh(null);
                              },
                              function (response) {
                                  // Refresh the list of data services
                                  DSSelectionService.refresh(null);
                              });
                          } catch (error) {
                              // Refresh the list of data services
                              DSSelectionService.refresh(null);
                          }
                        } else {
                          // Refresh the list of data services
                          DSSelectionService.refresh(null);
                        }
                    },
                    function (response) {
                        throw RepoRestService.newRestException($translate.instant('dsSummaryController.deleteFailedMsg', 
                                                                                  {response: RepoRestService.responseMessage(response)}));
                    });
            } catch (error) {
                throw RepoRestService.newRestException($translate.instant('dsSummaryController.deleteFailedMsg', 
                        {response: error.message}));
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

            // Show the delete confirmation modal
            vm.confirmDeleteMsg = $translate.instant('dsSummaryController.confirmDeleteMsg', {serviceName: item.keng__id});
            $('#confirmDeleteModal').modal('show');
        };

        /**
         * Handle deploy dataservice click
         */
        var deployDataServiceClicked = function ( ) {
            // Broadcast the pageChange
            $rootScope.$broadcast("dataServicePageChanged", 'dataservice-test');
        };

        /**
         * Handle edit dataservice menu select
         */
        var deployDataServiceMenuAction = function(action, item) {
            // Need to select the item first
            DSSelectionService.selectDataService(item);

            // Determine if the service can safely be deployed
            try {
                var selDSName = item.keng__id;
                RepoRestService.getDataServiceDeployableStatus( selDSName ).then(
                    function (result) {
                        var deployableMessage = result.Information.deployableStatus;
                        if(deployableMessage === "OK") {
                            deployDataServiceClicked();
                        } else {
                            var msg = $translate.instant('dsSummaryController.unableToDeployMsg') + "\n\n" + 
                                      deployableMessage;
                            alert(msg);
                        }
                    },
                    function (response) {
                        throw RepoRestService.newRestException($translate.instant('dsSummaryController.deployFailedMsg', 
                                                                                  {response: RepoRestService.responseMessage(response)}));
                    });
            } catch (error) {
                throw RepoRestService.newRestException($translate.instant('dsSummaryController.deployFailedMsg', 
                        {response: error.message}));
            }
        };
        
        /**
         * Handle edit dataservice click
         */
        var editDataServiceClicked = function( ) {
            EditWizardService.init(DSSelectionService.selectedDataService(), 'dataservice-edit');
        };

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
            // Check the data service sources - to see if they exist.
            var missingSources = [];
            if( item.serviceViewTables ) {
                for(var i = 0; i < item.serviceViewTables.length; ++i) {
                    var tableName = item.serviceViewTables[i];
                    var dotIndex = tableName.indexOf('.');
                    var sourceName = tableName.substring(0,dotIndex);
                    var hasSource = SvcSourceSelectionService.hasServiceSource(sourceName);
                    if(!hasSource) {
                        missingSources.push(sourceName);
                    }
                }
            }
            // If any data service sources are missing, disallow edit.
            if( missingSources.length > 0 ) {
                vm.cannotEditMsg = $translate.instant('dsSummaryController.cannotEditMissingSourcesMsg', {dsName: item.keng__id, srcList: missingSources.toString()});
                $('#cannotEditModal').modal('show');
            } else {
                vm.editDataService(item);
            }
        };

        /**
         * Handle clone dataservice click
         */
        var cloneDataServiceClicked = function( ) {
            // Broadcast the pageChange
            $rootScope.$broadcast("dataServicePageChanged", 'dataservice-clone');
        };
        
        /**
         * Handle documentation dataservice click
         */
        var documentationDataServiceClicked = function( ) {
            // Broadcast the pageChange
            $rootScope.$broadcast("dataServicePageChanged", 'dataservice-documentation');
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
         * Handle documentation dataservice menu select
         */
        var documentationDataServiceMenuAction = function(action, item) {
            // Need to select the item first
            DSSelectionService.selectDataService(item);

            documentationDataServiceClicked();
        };

        /**
         * Handle download data service menu item selected.
         */
        var downloadDataServiceMenuAction = function( action, item ) {
            DSSelectionService.selectDataService( item );
            var dataService = item;

            try {
                DownloadService.download( dataService );
            } catch ( error ) {
                
            } finally {
            }
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

            ImportExportService.init("export");
        };

        /**
         * Handle import dataservice button click
         */
        vm.importDataServiceButtonClicked = function() {
            ImportExportService.init("import");
        };

        /*
         * Notification that ImportExportService export init has finished
         */
        $scope.$on('exportInitFinished', function (event) {
            exportDataServiceClicked();
        });

        /*
         * Notification that ImportExportService import init has finished
         */
        $scope.$on('importInitFinished', function (event) {
            importDataServiceClicked();
        });

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
                if(theAction.name!==$translate.instant('shared.New') && theAction.name!=$translate.instant('shared.Import')) {
                    theAction.isDisabled = enabled;
                }
            });
            vm.actionsConfig.moreActions.forEach(function (theAction) {
                if(theAction.name!==$translate.instant('shared.New') && theAction.name!=$translate.instant('shared.Import')) {
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
                  name: $translate.instant('shared.New'),
                  title: $translate.instant('shared.NewWhat', {what: $translate.instant('shared.DataService')}),
                  actionFn: newDataServiceClicked,
                  isDisabled: false
              },
              {
                  name: $translate.instant('shared.Import'),
                  title: $translate.instant('shared.ImportWhat', {what: $translate.instant('shared.DataService')}),
                  actionFn: vm.importDataServiceButtonClicked
              }
          ],
          moreActions: [
//            {
//              name: $translate.instant('shared.Import'),
//              title: $translate.instant('shared.ImportWhat', {what: $translate.instant('shared.DataService')}),
//              actionFn: importDataServiceClicked,
//              isDisabled: false
//            }
          ],
          actionsInclude: true
        };

        vm.actionButtons = [
            {
                name: $translate.instant('shared.Edit'),
                title: $translate.instant('shared.EditWhat', {what: $translate.instant('shared.DataService')}),
                actionFn: editDataServiceMenuAction,
                include: false
            },
            {
                name: $translate.instant('shared.Test'),
                title: $translate.instant('shared.TestWhat', {what: $translate.instant('shared.DataService')}),
                actionFn: deployDataServiceMenuAction
            },
            {
                name: $translate.instant('dataservice-summary.codeSamplesDataService'),
                title: $translate.instant('dataservice-summary.codeSamplesDataService'),
                actionFn: documentationDataServiceMenuAction
            }
        ];

        vm.menuActions = [
            {
                name: $translate.instant('shared.Copy'),
                title: $translate.instant('shared.CopyWhat', {what: $translate.instant('shared.DataService')}),
                actionFn: cloneDataServiceMenuAction
            },
            {
                name: $translate.instant( 'shared.Download' ),
                title: $translate.instant( 'shared.Download' ),
                actionFn: downloadDataServiceMenuAction
            },
            {
                name: $translate.instant('dataservice-summary.GitExport'),
                title: $translate.instant('dataservice-summary.GitExport'),
                actionFn: exportDataServiceMenuAction
            },
            {
                name: $translate.instant('shared.Delete'),
                title: $translate.instant('shared.DeleteWhat', {what: $translate.instant('shared.DataService')}),
                actionFn: deleteDataServiceMenuAction
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
