(function () {
    'use strict';

    var pluginName = 'vdb-bench.dataservice';
    var pluginDirName = 'vdb-bench-dataservice';

    angular
        .module(pluginName)
        .controller('ConnectionSummaryController', ConnectionSummaryController);

    ConnectionSummaryController.$inject = ['$scope', '$rootScope', '$translate', 'RepoRestService', 'REST_URI', 'SYNTAX', 'DSPageService', 'DSSelectionService',
                                           'ConnectionSelectionService', 'TranslatorSelectionService', 'ConnectionWizardService',
                                           'DownloadService', 'CredentialService', 'DialogService', 'pfViewUtils'];

    function ConnectionSummaryController($scope, $rootScope, $translate, RepoRestService, REST_URI, SYNTAX, DSPageService, DSSelectionService,
                                         ConnectionSelectionService, TranslatorSelectionService, ConnectionWizardService,
                                         DownloadService, CredentialService, DialogService, pfViewUtils) {
        var vm = this;

        vm.connLoading = ConnectionSelectionService.isLoading();
        vm.deploymentSuccess = false;
        vm.deploymentMessage = null;
        vm.allItems = ConnectionSelectionService.getConnections();
        vm.items = vm.allItems;
        vm.deleteConnInProgress = false;
        vm.hasConnections = false;
        vm.confirmDeleteMsg = "";

        function setHelpId() {
            var page = DSPageService.page(DSPageService.CONNECTION_SUMMARY_PAGE);

            if (!vm.hasConnections)
                DSPageService.setCustomHelpId(page.id, "connection-summary-empty");
            else
                DSPageService.setCustomHelpId(page.id, null);
        }

        /*
         * When the connections have been loaded
         */
        $scope.$on('loadingConnectionsChanged', function (event, loading) {
            vm.connLoading = loading;
            if(vm.connLoading === false) {
                vm.allItems = ConnectionSelectionService.getConnections();
                vm.items = vm.allItems;
                vm.filterConfig.resultsCount = vm.items.length;
                vm.deleteConnInProgress = false;
                vm.hasConnections = vm.allItems.length>0;
            } else {
                vm.hasConnections = false;
            }
            setHelpId();
        });

        /**
         * Sets disabled state of all connection actions
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

        /**
         * Resets the list after a delete
         */
        var resetListAfterDelete = function (teiidErrorMsg, localErrorMsg) {
            var msg = '';

            if (teiidErrorMsg) {
                msg = msg + '<h3>' + $translate.instant('connectionSummaryController.removeServerDeploymentFailedMsg') + '</h3>';
                msg = msg + '<p>' + teiidErrorMsg + '</p>';
            }

            if (localErrorMsg) {
                msg = msg + '<h3>' + $translate.instant('connectionSummaryController.removeLocalConnectionFailedMsg') + '</h3>';
                msg = msg + '<p>' + localErrorMsg + '</p>';
            }

            if (! _.isEmpty(msg))
                DialogService.basicInfoMsg(msg);

            // Refresh the list of connections
            ConnectionSelectionService.refresh(true);

            vm.refresh();
            // Disable the actions until next selection
            setActionsDisabled(true);
        };

        /**
         * Delete the specified connection from the workspace
         */
        function deleteConnection(connName, teiidErrorMsg) {
           try {
                RepoRestService.deleteConnection(connName).then(
                    function () {
                        resetListAfterDelete(teiidErrorMsg);
                    },
                    function (response) {
                        resetListAfterDelete(teiidErrorMsg, RepoRestService.responseMessage(response));
                    });
            } catch (error) {
                resetListAfterDelete(teiidErrorMsg, RepoRestService.responseMessage(error));
            }
        }

        /**
         * Delete the specified connection from teiid, then remove the repo connection
         */
        function deleteTeiidConnection(connName) {
            // Set loading true
            vm.deleteConnInProgress = true;
            ConnectionSelectionService.setLoading(true);
            try {
                RepoRestService.deleteTeiidConnection(connName).then(
                    function () {
                        // delete repo vdb (server undeploy successful)
                        deleteConnection(connName);
                    },
                    function (response) {
                        // delete repo connection - (server undeploy failed)
                        deleteConnection(connName, RepoRestService.responseMessage(response));
                    });
            } catch (error) {
                // delete repo connection - (server undeploy failed)
                deleteConnection(connName, RepoRestService.responseMessage(error));
            }
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
         * Delete the selected Connection.
         * 1) undeploy the connection from the server
         * 2) delete the connection from the repo
         */
        vm.deleteSelectedConnection = function ( ) {
            var selName = ConnectionSelectionService.selectedConnection().keng__id;

            // dismiss the delete confirmation modal
            $('#confirmDeleteModal').modal('hide');
            // Deletes the server and workspace connections.  Also does a refresh when complete
            deleteTeiidConnection(selName);
        };

        /**
         * Handle delete Connection menu select
         */
        var deleteConnectionMenuAction = function(action, item) {
            // Need to select the item first
            ConnectionSelectionService.selectConnection(item);

            // Determine if any dataservices use this connection.  List them in the confirmation message
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
         * Handle export connection click
         */
        var exportConnectionClicked = function( ) {
            try {
                DownloadService.download(ConnectionSelectionService.selectedConnection());
            } catch (error) {} finally {
            }
        };
        
        /**
         * Handle export Connection menu select
         */
        var exportConnectionMenuAction = function(action, item) {
            // Need to select the item first
            ConnectionSelectionService.selectConnection(item);

            exportConnectionClicked();
        };

        //
        // TODO
        //
        // Cannot edit a connection since it cannot currently
        // be redeployed (deleted then recreated) without
        // refreshing teiid or restarting the JB instance
        //
        // See https://issues.jboss.org/browse/TEIID-4592
        //
        // /**
        //  * Handle edit Connection menu select
        //  */
        // var editConnectionMenuAction = function(action, item) {
        //     // Need to select the item first
        //     ConnectionSelectionService.selectConnection(item);
        //
        //     $rootScope.$broadcast("dataServicePageChanged", 'connection-edit');
        // };

        /**
         * Handle clone connection click
         */
        var cloneConnectionClicked = function( ) {
            // Broadcast the pageChange
            $rootScope.$broadcast("dataServicePageChanged", 'connection-clone');
        };

        /**
         * Handle clone Connection menu select
         */
        var cloneConnectionMenuAction = function(action, item) {
            // Need to select the item first
            ConnectionSelectionService.selectConnection(item);

            cloneConnectionClicked();
        };

        /**
         * Handle refresh click
         */
        var refreshClicked = function( ) {
            // Refresh the list of service sources
            ConnectionSelectionService.refresh(null);
            vm.refresh();
            // Disable the actions until next selection
            setActionsDisabled(true);
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
            ConnectionSelectionService.selectConnection(item, true);
            
            // Actions disabled unless one is selected
            var itemsSelected = vm.listConfig.selectedItems;
            if(itemsSelected.length === 0) {
                setActionsDisabled(true);
            } else {
                setActionsDisabled(false);
            }

            for (var prop in item) {
                if(!item.hasOwnProperty(prop))
                    continue;

                console.log("Item: " + item[prop]);
            }
        };
        /**
         * Connection Actions
         */
        vm.actionsConfig = {
          primaryActions: [
            {
              name: $translate.instant('connectionSummaryController.actionNameNew'),
              title: $translate.instant('connectionSummaryController.actionTitleNew'),
              actionFn: newConnectionClicked,
              isDisabled: false
            },
            {
              name: $translate.instant('connectionSummaryController.actionNameRefresh'),
              title: $translate.instant('connectionSummaryController.actionTitleRefresh'),
              actionFn: refreshClicked,
              isDisabled: false
            }
          ],
          moreActions: [
        //            {
        //              name: $translate.instant('connectionSummaryController.actionNameImport'),
        //              title: $translate.instant('connectionSummaryController.actionTitleImport'),
        //              actionFn: importConnectionClicked,
        //              isDisabled: false
        //            },
          ],
          actionsInclude: true
        };
     
        vm.actionButtons = [
            {
                name: $translate.instant('connectionSummaryController.actionNameDelete'),
                title: $translate.instant('connectionSummaryController.actionTitleDelete'),
                actionFn: deleteConnectionMenuAction,
                include: false,
                isDisabled: true
            }
        ];

        vm.menuActions = [
            {
                name: $translate.instant('connectionSummaryController.actionNameCopy'),
                title: $translate.instant('connectionSummaryController.actionTitleCopy'),
                actionFn: cloneConnectionMenuAction
            },
            {
                name: $translate.instant('connectionSummaryController.actionNameExport'),
                title: $translate.instant('connectionSummaryController.actionTitleExport'),
                actionFn: exportConnectionMenuAction
            }          ];

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
            // Disable delete if a different user owns the connection
            if(action.name==='Delete') {
                var owner = ConnectionSelectionService.getConnectionOwner(item);
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
                var owner = ConnectionSelectionService.getConnectionOwner(item);
                if( owner === CredentialService.credentials().username ) {
                    action.isDisabled = false;
                } else {
                    action.isDisabled = true;
                }
            }
        };

        /**
         * Access to the collection of connections
         */
        vm.refresh = function() {
            vm.allItems = ConnectionSelectionService.getConnections();
            vm.items = vm.allItems;
            vm.filterConfig.resultsCount = vm.items.length;
            vm.hasConnections = vm.allItems.length>0;
        };

        vm.refresh();
        setActionsDisabled(true);

    }

})();
