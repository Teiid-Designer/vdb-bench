var vdbBench = (function (vdbBench) {

    vdbBench.VdbController = vdbBench._module.controller('VdbController',
                                                         ['$scope',
                                                          '$modal',
                                                          '$window',
                                                          'RepoRestService',
                                                          'VdbSelectionService',
                                                          'SYNTAX',
                                                          'REST_URI',
                                                          'VDB_KEYS',
            function ($scope, $modal, $window, RepoRestService, VdbSelectionService, SYNTAX, REST_URI, VDB_KEYS) {

                var DIAGRAM_TAB_ID = "Diagram";
                var PREVIEW_TAB_ID = "Preview";

                /**
                 * Fetch the list of vdbs from the selected repository
                 */
                function initVdbs() {
                    try {
                        RepoRestService.getVdbs().then(
                            function (newVdbs) {
                                RepoRestService.copy(newVdbs, $scope.vdbOrbit.vdbs);
                            },
                            function (response) {
                                // Some kind of error has occurred
                                $scope.vdbOrbit.vdbs = [];
                                throw new vdbBench.RestServiceException("Failed to load vdbs from the host services.\n" + response.message);
                            });
                    } catch (error) {
                        $scope.vdbOrbit.vdbs = [];
                        alert("An exception occurred:\n" + error.message);
                    }

                    // Removes any outdated vdb
                    VdbSelectionService.setSelected(null);
                }

                $scope.vdbOrbit = {};
                $scope.vdbOrbit.vdbs = [];
                $scope.vdbOrbit.previewRefresh = false;
                $scope.vdbOrbit.visibleTabId = DIAGRAM_TAB_ID;
                $scope.vdbOrbit.selectedVdbComponent = [];

                $scope.vdbOrbit.selectVdb = function(vdb) {
                    if (vdb) {
                        //
                        // Ensure that the search results pane is hidden
                        //
                        $scope.searchOrbit.setVisible(false);

                        //
                        // Ensure the reports are deselected
                        //
                        $scope.reportOrbit.selectReport(null);
                    }

                    //
                    // Set the selected vdb
                    //
                    VdbSelectionService.setSelected(vdb);
                };

                $scope.vdbOrbit.vdbSelected = function() {
                    return VdbSelectionService.selected();
                }

                /**
                 * Options for the codemirror editor used for previewing vdb xml
                 */
                $scope.vdbOrbit.xmlPreviewOptions = {
                    lineWrapping: true,
                    lineNumbers: true,
                    readOnly: 'nocursor',
                    mode: 'xml'
                };

                function tabUpdate() {
                    //
                    // Only update preview tab if it is currently visible
                    // Setting the value of the codemirror editor before its visible
                    // causes it to not display when its tab is clicked on (requires an extra click)
                    //
                    // However, need to update the tab if it is displayed
                    //
                    if ($scope.vdbOrbit.visibleTabId == PREVIEW_TAB_ID)
                        VdbSelectionService.selectedXml();
                }

                $scope.$on('selectedVdbChanged', function () {
                    tabUpdate();
                });

                /**
                 * When the preview tab is selected, fetch the selected vdb xml
                 * and display it in the code mirror editor
                 */
                $scope.vdbOrbit.onTabSelected = function (tabId) {
                    // Stash the tab id for use with updating the preview tab
                    $scope.vdbOrbit.visibleTabId = tabId;

                    tabUpdate();

                    // This does not seem to work but leave it here for now
                    // and come back later
                    setTimeout(function () {
                        $scope.vdbOrbit.previewRefresh = !$scope.vdbOrbit.previewRefresh;
                    }, 2000);
                };

                /**
                 * Event handler for clicking the add button
                 */
                $scope.vdbOrbit.onAddClicked = function (event) {
                    try {
                        $window.alert("To be implemented");
                    } catch (error) {

                    } finally {
                        // Essential to stop the accordion closing
                        event.stopPropagation();
                    }
                };

                /**
                 * Event handler for clicking the remove button
                 */
                $scope.vdbOrbit.onRemoveClicked = function (event) {
                    var selected = VdbSelectionService.selected();
                    try {
                        RepoRestService.removeVdb(selected).then(
                            function () {
                                // Reinitialise the list of vdbs
                                initVdbs();
                            },
                            function (response) {
                                throw new vdbBench.RestServiceException("Failed to remove the vdb " + selected.id + "from the host services.\n" + response.message);
                            });
                    } catch (error) {} finally {
                        // Essential to stop the accordion closing
                        event.stopPropagation();
                    }
                }

                $scope.searchOrbit = {};
                $scope.searchOrbit.searchName = '';
                $scope.searchOrbit.containsTerm = '';
                $scope.searchOrbit.typeTerm = '';
                $scope.searchOrbit.pathTerm = '';
                $scope.searchOrbit.parentTerm = '';
                $scope.searchOrbit.objectNameTerm = '';
                $scope.searchOrbit.visible = false;
                $scope.searchOrbit.results = [];

                $scope.searchOrbit.isVisible = function() {
                    return $scope.searchOrbit.visible;
                }

                $scope.searchOrbit.setVisible = function(visible) {
                    if ($scope.searchOrbit.visible == visible)
                        return;

                    $scope.searchOrbit.visible = visible;
                }

                $scope.searchOrbit.submit = function() {
                    if (_.isEmpty($scope.searchOrbit.searchName) &&
                        _.isEmpty($scope.searchOrbit.containsTerm) &&
                        _.isEmpty($scope.searchOrbit.typeTerm) &&
                        _.isEmpty($scope.searchOrbit.pathTerm) &&
                        _.isEmpty($scope.searchOrbit.parentTerm) &&
                        _.isEmpty($scope.searchOrbit.objectNameTerm))
                        return;

                    //
                    // Ensure there is no vdb selected so that the
                    // vdb visualisation pane is hidden
                    //
                    $scope.vdbOrbit.selectVdb(null);

                    //
                    // Display the search results pane
                    //
                    $scope.searchOrbit.setVisible(true);

                    var term = {}
                    if (! _.isEmpty($scope.searchOrbit.searchName))
                        term[REST_URI.SEARCH_SAVE_NAME] = $scope.searchOrbit.searchName;

                    if (! _.isEmpty($scope.searchOrbit.containsTerm))
                        term[REST_URI.SEARCH_CONTAINS] = $scope.searchOrbit.containsTerm;

                    if (! _.isEmpty($scope.searchOrbit.typeTerm))
                        term[REST_URI.SEARCH_TYPE] = $scope.searchOrbit.typeTerm;

                    if (! _.isEmpty($scope.searchOrbit.pathTerm))
                        term[REST_URI.SEARCH_PATH] = $scope.searchOrbit.pathTerm;

                    if (! _.isEmpty($scope.searchOrbit.parentTerm))
                        term[REST_URI.SEARCH_PARENT] = $scope.searchOrbit.parentTerm;

                    if (! _.isEmpty($scope.searchOrbit.objectNameTerm))
                        term[REST_URI.SEARCH_OBJECT_NAME] = $scope.searchOrbit.objectNameTerm;

                    RepoRestService.search(term).then(
                        function (results) {
                            if (_.isEmpty(results)) {
                                $scope.searchOrbit.results = [];
                                $scope.searchOrbit.results[0] = {};
                                $scope.searchOrbit.results[0][VDB_KEYS.ID] = "No search results found";
                            }
                            else
                                $scope.searchOrbit.results = results;
                        },
                        function (response) {
                            var msg = "";
                            if (response.config)
                                msg = "url : " + response.config.url + SYNTAX.NEWLINE;

                            msg = msg + "status : " + response.status + SYNTAX.NEWLINE;
                            msg = msg + "data : " + response.data + SYNTAX.NEWLINE;
                            msg = msg + "status message : " + response.statusText + SYNTAX.NEWLINE;

                            $scope.searchOrbit.results = [];
                            $scope.searchOrbit.results[0] = {};
                            $scope.searchOrbit.results[0][VDB_KEYS.ID] = "Error occurred while searching the repository:\n" + msg;
                        }
                    );
                }

                $scope.searchOrbit.setSelectedResult = function(result) {
                    $scope.searchOrbit.resultSelected = result;
                }

                $scope.searchOrbit.selectedResult = function() {
                    return $scope.searchOrbit.resultSelected;
                }

                /**
                 * Event handler for clicking the save search button
                 */
                $scope.searchOrbit.onSaveClicked = function (event) {
                    try {
                        // If no terms entered then do nothing
                        if (_.isEmpty($scope.searchOrbit.containsTerm) &&
                            _.isEmpty($scope.searchOrbit.typeTerm) &&
                            _.isEmpty($scope.searchOrbit.pathTerm) &&
                            _.isEmpty($scope.searchOrbit.parentTerm) &&
                            _.isEmpty($scope.searchOrbit.objectNameTerm))
                            return;

                        //
                        // Display a dialog to ask for the name of the search
                        //
                        var modalTemplate = '<div class="modal-header">' +
                                                         '<h3 class="modal-title">Enter an identifying name for the saved search</h3>' +
                                                         '</div>' +
                                                         '<div class="modal-body">' +
                                                         '<input type="text" ng-model="searchName"/>' +
                                                         '</div>' +
                                                         '<div class="modal-footer">' +
                                                         '<button class="btn btn-primary" ng-click="ok()">OK</button>' +
                                                         '<button class="btn btn-warning" ng-click="cancel()">Cancel</button>' +
                                                         '</div>';

                        var modal = $modal.open( {
                            animation: 'true',
                            backdrop: 'false',
                            template: modalTemplate,
                            controller: ['$scope', '$modalInstance', function ($scope, $modalInstance) {
                                $scope.ok = function() {
                                    $modalInstance.close($scope.searchName || '');
                                };
                                $scope.cancel = function() {
                                    $modalInstance.dismiss('cancel');
                                }
                            }]
                        });

                        //
                        // If modal has a searchName then save it using the rest service
                        //
                        modal.result.then(
                            function (searchName) {
                                var searchAttributes = {
                                    'searchName' : searchName,
                                };

                                // Adds those attributes that have values
                                if (! _.isEmpty($scope.searchOrbit.containsTerm))
                                    searchAttributes[REST_URI.SEARCH_CONTAINS] = $scope.searchOrbit.containsTerm;
                                if (! _.isEmpty($scope.searchOrbit.typeTerm))
                                    searchAttributes[REST_URI.SEARCH_TYPE] = $scope.searchOrbit.typeTerm;
                                if (! _.isEmpty($scope.searchOrbit.pathTerm))
                                    searchAttributes[REST_URI.SEARCH_PATH] = $scope.searchOrbit.pathTerm;
                                if (! _.isEmpty($scope.searchOrbit.parentTerm))
                                    searchAttributes[REST_URI.SEARCH_PARENT] = $scope.searchOrbit.parentTerm;
                                if (! _.isEmpty($scope.searchOrbit.objectNameTerm))
                                    searchAttributes[REST_URI.SEARCH_OBJECT_NAME] = $scope.searchOrbit.objectNameTerm;

                                //
                                // Call the rest service to post the new search
                                //
                                RepoRestService.saveSearch(searchAttributes).then(
                                    function (results) {
                                        alert("Save completed");
                                        initReports();
                                    },
                                    function (response) {
                                        var msg = "";
                                        if (response.config)
                                            msg = "url : " + response.config.url + SYNTAX.NEWLINE;

                                        msg = msg + "status : " + response.status + SYNTAX.NEWLINE;
                                        msg = msg + "data : " + response.data + SYNTAX.NEWLINE;
                                        msg = msg + "status message : " + response.statusText + SYNTAX.NEWLINE;

                                        alert("Error occurred while searching the repository:\n" + msg);
                                    }
                                ); 
                            },
                            function () {
                                // nothing to do - cancel was clicked in the search name dialog
                            }
                        );
                    } catch (error) {
                        // nothing to do
                    } finally {
                        // Essential to stop the accordion closing
                        event.stopPropagation();
                    }
                }

                $scope.reportOrbit = {};
                $scope.reportOrbit.defaultReports = [
                    { id: 'ALL_DATA_SOURCES', name: 'All data sources' },
                    { id: 'SOURCES_MODELS', name: 'Source models using a data source' },
                    { id: 'NAMED_COLUMNS', name: 'Find all columns of a certain name' }
                ];

                /**
                 * Fetch the list of search reports from the selected repository
                 */
                function initReports() {
                    $scope.reportOrbit.reports = []
                    $scope.reportOrbit.reports = $scope.reportOrbit.reports.concat($scope.reportOrbit.defaultReports);

                    try {
                        RepoRestService.getSearches().then(
                            function (newSearches) {
                                RepoRestService.copy(newSearches, $scope.reportOrbit.reports);

                                // Ensure the default reports are also available
                                $scope.reportOrbit.reports = $scope.reportOrbit.reports.concat($scope.reportOrbit.defaultReports);
                            },
                            function (response) {
                                // Some kind of error has occurred
                                throw new vdbBench.RestServiceException("Failed to load searches from the host services.\n" + response.message);
                            });
                    } catch (error) {
                        alert("An exception occurred:\n" + error.message);
                    }
                }

                $scope.reportOrbit.selectReport = function(report) {
                    if (report) {
                        //
                        // Ensure there is no vdb selected so that the
                        // vdb visualisation pane is hidden
                        //
                        $scope.vdbOrbit.selectVdb(null);
                    }

                    //
                    // Stash the selected report
                    //
                    $scope.reportOrbit.selectedReport = report;

                    if (! report)
                        return;

                    switch (report.id) {
                        case 'NAMED_COLUMNS':

                            var modalTemplate = '<div class="modal-header">' +
                                                              '<h3 class="modal-title">{{header}}</h3>' +
                                                              '</div>' +
                                                              '<div class="modal-body">' +
                                                              '<div ng-show="description" ng-bind-html="description"></div>' +
                                                              '<input type="text" ng-model="columnName"/>' +
                                                              '</div>' +
                                                              '<div class="modal-footer">' +
                                                              '<button class="btn btn-primary" ng-click="ok()">OK</button>' +
                                                              '<button class="btn btn-warning" ng-click="cancel()">Cancel</button>' +
                                                              '</div>';

                            var modal = $modal.open( {
                                animation: 'true',
                                backdrop: 'false',
                                template: modalTemplate,
                                controller: ['$scope', '$modalInstance', function ($scope, $modalInstance) {
                                    $scope.header = "Enter Column Name";
                                    $scope.description = "<p>The value can be a full column name or a partial keyword using the wildcard '%'</p>";
                                    $scope.ok = function() {
                                        $modalInstance.close($scope.columnName || '');
                                    };
                                    $scope.cancel = function() {
                                        $modalInstance.dismiss('cancel');
                                    }
                                }]
                            });

                            modal.result.then(
                                function (name) {
                                    $scope.searchOrbit.searchName = '';
                                    $scope.searchOrbit.containsTerm = '';
                                    $scope.searchOrbit.pathTerm = '';
                                    $scope.searchOrbit.parentTerm = '';
                                    $scope.searchOrbit.objectNameTerm = name;
                                    $scope.searchOrbit.typeTerm = 'Column';
                                    $scope.searchOrbit.submit();
                                },
                                function () {
                                    // nothing to do
                                }
                            );

                            break;
                        case 'ALL_DATA_SOURCES':
                        case 'SOURCES_MODELS':
                            alert('To be implemented');
                            break;
                        default:
                            //
                            // Ask the rest service to submit the search
                            //
                            $scope.searchOrbit.searchName = report.name;
                            $scope.searchOrbit.containsTerm = '';
                            $scope.searchOrbit.pathTerm = '';
                            $scope.searchOrbit.parentTerm = '';
                            $scope.searchOrbit.objectNameTerm = '';
                            $scope.searchOrbit.typeTerm = '';
                            $scope.searchOrbit.submit();

                            // Reset the search name since we cannot reset anywhere else
                            $scope.searchOrbit.searchName = '';
                    }
                }

                $scope.reportOrbit.reportSelected = function() {
                    return $scope.reportOrbit.selectedReport;
                }

                /**
                 * Event handler for clicking the delete search button
                 */
                $scope.reportOrbit.onDeleteClicked = function (event) {
                    try {
                        if (_.isEmpty($scope.reportOrbit.selectedReport))
                            return;

                        // Cannot delete default reports at the moment
                        if (!_.isEmpty($scope.reportOrbit.selectedReport.report.id))
                            return;

                        //
                        // Call the rest service to delete the existing search
                        //
                        RepoRestService.deleteSavedSearch($scope.reportOrbit.selectedReport.name).then(
                            function (results) {
                                $scope.reportOrbit.selectedReport = '';
                                initReports();
                            },
                            function (response) {
                                var msg = "";
                                if (response.config)
                                    msg = "url : " + response.config.url + SYNTAX.NEWLINE;

                                msg = msg + "status : " + response.status + SYNTAX.NEWLINE;
                                msg = msg + "data : " + response.data + SYNTAX.NEWLINE;
                                msg = msg + "status message : " + response.statusText + SYNTAX.NEWLINE;

                                alert("Error occurred while searching the repository:\n" + msg);
                            }
                        );
                    } catch (error) {
                        // nothing to do
                    } finally {
                        // Essential to stop the accordion closing
                        event.stopPropagation();
                    }
                }

                $scope.destroy = function (vdb) {
                    vdb.remove().then(function () {
                        $scope.vdbOrbit.vdbs = _.without($scope.vdbOrbit.vdbs, vdb);
                    });
                };

                // Initialise vdb collection on loading
                initVdbs();

                // Initialise the reports collection on loading
                initReports();

            }
        ]);
    return vdbBench;

})(vdbBench || {});
