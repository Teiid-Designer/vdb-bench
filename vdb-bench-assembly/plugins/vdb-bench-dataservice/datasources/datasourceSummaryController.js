(function () {
    'use strict';

    var pluginName = 'vdb-bench.dataservice';
    var pluginDirName = 'vdb-bench-dataservice';

    angular
        .module(pluginName)
        .controller('DatasourceSummaryController', DatasourceSummaryController);

    DatasourceSummaryController.$inject = ['$scope', '$rootScope', '$translate', '$interval', 'RepoRestService', 'REST_URI', 'SYNTAX', 'DSPageService', 'DSSelectionService',
                                           'SvcSourceSelectionService', 'TranslatorSelectionService', 'DatasourceWizardService', 
                                           'ConnectionSelectionService', 'DownloadService', 'CredentialService', 'pfViewUtils'];

    function DatasourceSummaryController($scope, $rootScope, $translate, $interval, RepoRestService, REST_URI, SYNTAX, DSPageService, DSSelectionService,
                                          SvcSourceSelectionService, TranslatorSelectionService, DatasourceWizardService, 
                                          ConnectionSelectionService, DownloadService, CredentialService, pfViewUtils) {
        var vm = this;

        vm.srcLoading = SvcSourceSelectionService.isLoading();
        vm.deploymentSuccess = false;
        vm.deploymentMessage = null;
        vm.allItems = SvcSourceSelectionService.getServiceSources();
        vm.items = vm.allItems;
        vm.selectedSourceDDL = "";
        vm.deleteVdbInProgress = false;
        vm.displayDdl = false; // Do not display by default
        vm.hasSources = false;
        vm.confirmDeleteMsg = "";

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

        function setHelpId() {
            var page = DSPageService.page(DSPageService.SERVICESOURCE_SUMMARY_PAGE);

            if (!vm.hasSources)
                DSPageService.setCustomHelpId(page.id, "datasource-summary-empty");
            else
                DSPageService.setCustomHelpId(page.id, null);
        }

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
                vm.hasSources = vm.allItems.length>0;
            } else {
                vm.hasSources = false;
            }
            setHelpId();
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

            vm.selectedSourceDDL = $translate.instant('datasourceSummaryController.gettingDdlMsg');

            var vdbName = SvcSourceSelectionService.selectedServiceSource().keng__id;

            var schemaSuccessCallback = function(model) {
                try {
                    RepoRestService.getTeiidVdbModelSchema( vdbName, model.keng__id ).then(
                        function ( result ) {
                            vm.selectedSourceDDL = result.Information.schema;
                        },
                        function (response) {
                            var getDdlFailedMsg = $translate.instant('datasourceSummaryController.getDdlFailedMsg');
                            vm.selectedSourceDDL = getDdlFailedMsg + "\n" + RepoRestService.responseMessage(response);
                        });
                } catch (error) {
                    var getDdlFailedMsg = $translate.instant('datasourceSummaryController.getDdlFailedMsg');
                    vm.selectedSourceDDL = getDdlFailedMsg + "\n" + error;
                }
            };

            var failureCallback = function(errorMsg) {
                var getDdlFailedMsg = $translate.instant('datasourceSummaryController.getDdlFailedMsg');
                vm.selectedSourceDDL = getDdlFailedMsg + "\n" + errorMsg;
            };

            SvcSourceSelectionService.selectedServiceSourceModel(schemaSuccessCallback, failureCallback);
        }

        /** 
         * Sets disabled state of all ServiceSource actions
         */
        function setActionsDisabled(enabled) {
            vm.actionsConfig.primaryActions.forEach(function (theAction) {
                if(theAction.name!=='Refresh' && theAction.name!=='New' && theAction.name!='Import') {
                    theAction.isDisabled = enabled;
                }
            });
            vm.actionsConfig.moreActions.forEach(function (theAction) {
                if(theAction.name!=='Refresh' && theAction.name!=='New' && theAction.name!=='Import' && theAction.name!=='Display DDL') {
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
         * Background function that updates datasource status
         * The check is performed every 45 seconds
         */
        function backgroundCheckSourceStatus() {
            var statusChecker = $interval(function() {

                try {
                    // Update workspace VDBs from teiid, then update row statuses
                    RepoRestService.updateWorkspaceVdbStatusFromTeiid().then(
                        function (result) {
                            updateRowStatuses();
                        },
                        function (response) {
                            // Some kind of error has occurred
                            throw RepoRestService.newRestException("Failed to update workspace sources.\n" + response.message);
                        });
                } catch (error) {
                    alert("An error occurred:\n" + error.message);
                }

            }, 45000);
        }

        /**
         * Update row status from workspace VDB status, if the status has changed
         */
        function updateRowStatuses() {
            try {
                RepoRestService.getVdbs(REST_URI.WKSP_SERVICE).then(
                    // Get workspace VDBs
                    function (wkspVdbs) {
                        // Determine if any status have changed.  If so, update the status and message of the changed row
                        for(var i = 0; i < wkspVdbs.length; i++) {
                            if( SvcSourceSelectionService.isServiceSource(wkspVdbs[i]) ) {
                                var srcName = wkspVdbs[i].keng__id;
                                for(var iRow = 0; iRow < vm.items.length; iRow++) {
                                    if(vm.items[iRow].keng__id === srcName) {
                                        var teiidStatus = SvcSourceSelectionService.getServiceSourceStatus(wkspVdbs[i]);
                                        var rowItemStatus = SvcSourceSelectionService.getServiceSourceStatus(vm.items[iRow]);
                                        // If the teiid status is different than current row, update the row item to match
                                        if(rowItemStatus !== teiidStatus) {
                                            var teiidStatusMessage = SvcSourceSelectionService.getServiceSourceStatusMessage(wkspVdbs[i]);
                                            for(var key in vm.items[iRow].keng__properties) {
                                                var propName = vm.items[iRow].keng__properties[key].name;
                                                if(propName=='dsbTeiidStatus') {
                                                    vm.items[iRow].keng__properties[key].value = teiidStatus;
                                                } else if(propName=='dsbTeiidStatusMessage') {
                                                    vm.items[iRow].keng__properties[key].value = teiidStatusMessage;
                                                }
                                            }
                                        }
                                    }
                                }
                            }
                        }
                    },
                    function (response) {
                        // Some kind of error has occurred
                        throw RepoRestService.newRestException("Failed to get sources for status update.\n" + response.message);
                    });
            } catch (error) {
                alert("An error occurred:\n" + error.message);
            }
        }
            
        /**
         * Delete the specified VDB from the server, then remove the repo VDB
         */
        function deleteServerVdb(vdbName) {
            // Set loading true
            vm.deleteVdbInProgress = true;
            SvcSourceSelectionService.setLoading(true);
            try {
                RepoRestService.deleteTeiidVdb( vdbName ).then(
                    function () {
                        // delete repo vdb (server undeploy successful)
                        deleteVdb(vdbName, true);
                    },
                    function (response) {
                        // delete repo vdb - (server undeploy failed)
                        deleteVdb(vdbname, false);
                    });
            } catch (error) {
                // delete repo vdb - (server undeploy failed)
                deleteVdb(vdbname, false);
            }
        }

        /**
         * Delete the specified VDB from the workspace
         */
        function deleteVdb(vdbName, serverUndeploySuccess) {
           try {
                RepoRestService.deleteVdb( vdbName ).then(
                    function () {
                        resetListAfterDelete(serverUndeploySuccess);
                    },
                    function (response) {
                        resetListAfterDelete(serverUndeploySuccess);
                        var removeLocalSourceFailedMsg = $translate.instant('datasourceSummaryController.removeLocalSourceFailedMsg');
                        throw RepoRestService.newRestException(removeLocalSourceFailedMsg + "\n" + RepoRestService.responseMessage(response));
                    });
            } catch (error) {
                resetListAfterDelete(serverUndeploySuccess);
                var removeLocalSourceFailedMsg = $translate.instant('datasourceSummaryController.removeLocalSourceFailedMsg');
                throw RepoRestService.newRestException(removeLocalSourceFailedMsg + "\n" + error);
            }
        }

        /** 
         * Resets the list after a delete
         */
        var resetListAfterDelete = function (serverUndeploySuccess) {
            if(serverUndeploySuccess) {
                // Refresh the list of service sources
                SvcSourceSelectionService.refresh(null);
                vm.refresh();
                // Disable the actions until next selection
                setActionsDisabled(true);
                vm.selectedSourceDDL = "";
            } else {
                var removeServerDeploymentFailedMsg = $translate.instant('datasourceSummaryController.removeServerDeploymentFailedMsg');
                throw RepoRestService.newRestException(removeServerDeploymentFailedMsg + "\n" + error);
            }
        };

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
          var match = false;

          if (filter.id === 'name') {
              if( angular.isDefined(item.keng__id) && item.keng__id !== null ) {
                  match = item.keng__id.match(filter.value) !== null;
              }
          } else if (filter.id === 'description') {
              if( angular.isDefined(item.vdb__description) && item.vdb__description !== null ) {
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

        vm.viewsConfig = {
          currentView: pfViewUtils.getListView().id
        };
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
         * Delete the selected ServiceSource.
         * 1) undeploy the vdb from the server
         * 2) delete the vdb from the repo
         */
        vm.deleteSelectedSvcSource = function ( ) {
            var selVdbName = SvcSourceSelectionService.selectedServiceSource().keng__id;

            // dismiss the delete confirmation modal
            $('#confirmDeleteModal').modal('hide');
            // Deletes the server and workspace vdbs.  Also does a refresh when complete
            deleteServerVdb(selVdbName);
        };

        /**
         * Handle delete ServiceSource menu select
         */
        var deleteSvcSourceMenuAction = function(action, item) {
            // Need to select the item first
            SvcSourceSelectionService.selectServiceSource(item);

            // Determine if any dataservices use this source.  List them in the confirmation message
            var dsList = DSSelectionService.getDataservicesUsingSource(item.keng__id);
            if( dsList.length > 0 ) {
                vm.confirmDeleteMsg = $translate.instant('datasourceSummaryController.confirmDeleteDataservicesAffectedMsg', {sourceName: item.keng__id, dsList: dsList.toString()});
            } else {
                // show the delete confirmation modal
                vm.confirmDeleteMsg = $translate.instant('datasourceSummaryController.confirmDeleteMsg', {sourceName: item.keng__id});
            }

            $('#confirmDeleteModal').modal('show');
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
         * Handle edit ServiceSource menu select
         */
        var editSvcSourceMenuAction = function(action, item) {
            // Need to select the item first
            SvcSourceSelectionService.selectServiceSource(item);

            // Init the DatasourceWizardService.  The Wizard service handles the page change when ready. 
            DatasourceWizardService.init(SvcSourceSelectionService.selectedServiceSource(), 'svcsource-edit');
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
         * Handle refresh click
         */
        var refreshClicked = function( ) {
            // Refresh the list of service sources
            SvcSourceSelectionService.refresh(null);
            vm.refresh();
            // Disable the actions until next selection
            setActionsDisabled(true);
            vm.selectedSourceDDL = "";
        };
        
        /**
         * Handle new ServiceSource click.  The Wizard service handles the page change when ready.
         */
        var newSvcSourceClicked = function( ) {
            DatasourceWizardService.init(null, 'svcsource-new');
        };
        
        /**
         * Handle import ServiceSource click
         */
//        var importSvcSourceClicked = function( ) {
//            // Broadcast the pageChange
//            $rootScope.$broadcast("dataServicePageChanged", 'svcsource-import');
//        };

        /**
         * Closes the DDL frame.
         */
        vm.hideDdl = function() {
            if ( vm.displayDdl ) {
                vm.displayDdl = false;
                vm.menuActions[ 0 ].name = $translate.instant('datasourceSummaryController.actionNameDisplayDdl');
            }
        };

        /**
         * Toggle the displaying of the DDL window
         */
        var showHideDDLClicked = function( action, item ) {
            SvcSourceSelectionService.selectServiceSource( item );
            vm.displayDdl = ! vm.displayDdl;
            setDDL();

            if ( vm.displayDdl ) {
                vm.menuActions[ 0 ].name = $translate.instant('datasourceSummaryController.actionNameHideDdl');
            } else {
                vm.menuActions[ 0 ].name = $translate.instant('datasourceSummaryController.actionNameDisplayDdl');
            }

            // select the row whose show/hide DDL menu item was selected
            vm.listConfig.selectedItems = [ item ];
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
              name: $translate.instant('datasourceSummaryController.actionNameNew'),
              title: $translate.instant('datasourceSummaryController.actionTitleNew'),
              actionFn: newSvcSourceClicked,
              isDisabled: false
            },
            {
              name: $translate.instant('datasourceSummaryController.actionNameRefresh'),
              title: $translate.instant('datasourceSummaryController.actionTitleRefresh'),
              actionFn: refreshClicked,
              isDisabled: false
            }
          ],
          moreActions: [
//            {
//              name: $translate.instant('datasourceSummaryController.actionNameImport'),
//              title: $translate.instant('datasourceSummaryController.actionTitleImport'),
//              actionFn: importSvcSourceClicked,
//              isDisabled: false
//            },
          ],
          actionsInclude: true
        };

        vm.actionButtons = [
            {
                name: $translate.instant('datasourceSummaryController.actionNameEdit'),
                title: $translate.instant('datasourceSummaryController.actionTitleEdit'),
                actionFn: editSvcSourceMenuAction,
                include: false,
                isDisabled: true
            }
        ];

        vm.menuActions = [
            {
                name: $translate.instant('datasourceSummaryController.actionNameDisplayDdl'),
                title: $translate.instant('datasourceSummaryController.actionTitleDisplayDdl'),
                actionFn: showHideDDLClicked
            },
            {
                name: $translate.instant('datasourceSummaryController.actionNameCopy'),
                title: $translate.instant('datasourceSummaryController.actionTitleCopy'),
                actionFn: cloneSvcSourceMenuAction
            },
            {
                name: $translate.instant('datasourceSummaryController.actionNameExport'),
                title: $translate.instant('datasourceSummaryController.actionTitleExport'),
                actionFn: exportSvcSourceMenuAction
            },
            {
                name: $translate.instant('datasourceSummaryController.actionNameDelete'),
                title: $translate.instant('datasourceSummaryController.actionTitleDelete'),
                actionFn: deleteSvcSourceMenuAction
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
         * Sets the listView button enablements
         */
        vm.enableButton = function(action, item) {
            // Disable edit if a different user owns the datasource
            if(action.name==='Edit') {
                var owner = SvcSourceSelectionService.getServiceSourceOwner(item);
                if( owner === CredentialService.credentials().username ) {
                    return true;
                } else {
                    return false;
                }
            }
        };

        /**
         * Sets the listView menu actions enablements
         */
        vm.enableMenuAction = function(action, item) {
            // Disable delete if a different user owns the datasource
            if(action.name==='Delete') {
                var owner = SvcSourceSelectionService.getServiceSourceOwner(item);
                if( owner === CredentialService.credentials().username ) {
                    action.isDisabled = false;
                } else {
                    action.isDisabled = true;
                }
            }
        };

        /**
         * Access to the collection of data services
         */
        vm.refresh = function() {
            vm.allItems = SvcSourceSelectionService.getServiceSources();
            vm.items = vm.allItems;
            vm.filterConfig.resultsCount = vm.items.length;
            vm.hasSources = vm.allItems.length>0;
            // Starts background polling to check
            backgroundCheckSourceStatus();
        };

        vm.refresh();
        setActionsDisabled(true);

    }

})();
