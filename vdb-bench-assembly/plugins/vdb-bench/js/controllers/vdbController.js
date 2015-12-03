var vdbBench = (function (vdbBench) {

    vdbBench.VdbController = vdbBench._module.controller('VdbController',
                                                         ['$scope',
                                                          '$modal',
                                                          'RepoRestService',
                                                          'VdbSelectionService',
                                                          'SYNTAX',
                                                          'REST_URI',
                                                          'VDB_KEYS',
            function ($scope, $modal, RepoRestService, VdbSelectionService, SYNTAX, REST_URI, VDB_KEYS) {

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
                    //
                    // Ensure that the search results pane is hidden
                    //
                    $scope.searchOrbit.setVisible(false);

                    //
                    // Ensure the reports are deselected
                    //
                    $scope.reportOrbit.selectReport(null);

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
                };

                $scope.searchOrbit = {};
                $scope.searchOrbit.containsTerm = '';
                $scope.searchOrbit.typeTerm = '';
                $scope.searchOrbit.pathTerm = '';
                $scope.searchOrbit.parentTerm = '';
                $scope.searchOrbit.nameTerm = '';
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
                    if (_.isEmpty($scope.searchOrbit.containsTerm) &&
                        _.isEmpty($scope.searchOrbit.typeTerm) &&
                        _.isEmpty($scope.searchOrbit.pathTerm) &&
                        _.isEmpty($scope.searchOrbit.parentTerm) &&
                        _.isEmpty($scope.searchOrbit.nameTerm))
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
                    if (! _.isEmpty($scope.searchOrbit.containsTerm))
                        term[REST_URI.SEARCH_CONTAINS] = $scope.searchOrbit.containsTerm;

                    if (! _.isEmpty($scope.searchOrbit.typeTerm))
                        term[REST_URI.SEARCH_TYPE] = $scope.searchOrbit.typeTerm;

                    if (! _.isEmpty($scope.searchOrbit.pathTerm))
                        term[REST_URI.SEARCH_PATH] = $scope.searchOrbit.pathTerm;

                    if (! _.isEmpty($scope.searchOrbit.parentTerm))
                        term[REST_URI.SEARCH_PARENT] = $scope.searchOrbit.parentTerm;

                    if (! _.isEmpty($scope.searchOrbit.nameTerm))
                        term[REST_URI.SEARCH_NAME] = $scope.searchOrbit.nameTerm;

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
                };

                $scope.searchOrbit.setSelectedResult = function(result) {
                    $scope.searchOrbit.resultSelected = result;
                }

                $scope.searchOrbit.selectedResult = function() {
                    return $scope.searchOrbit.resultSelected;
                }

                $scope.reportOrbit = {};
                $scope.reportOrbit.reports = [
                    { id: 'ALL_DATA_SOURCES', name: 'All data sources' },
                    { id: 'SOURCES_MODELS', name: 'Source models using a data source' },
                    { id: 'NAMED_COLUMNS', name: 'Find all columns of a certain name' }
                ];

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
                                    $scope.searchOrbit.containsTerm = '';
                                    $scope.searchOrbit.pathTerm = '';
                                    $scope.searchOrbit.parentTerm = '';
                                    $scope.searchOrbit.nameTerm = name;
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
                        case 'REPORT_4':
                        case 'REPORT_5':
                        default:
                            window.alert('To be implemented');
                    }
                }

                $scope.reportOrbit.reportSelected = function() {
                    return $scope.reportOrbit.selectedReport;
                }

                $scope.destroy = function (vdb) {
                    vdb.remove().then(function () {
                        $scope.vdbOrbit.vdbs = _.without($scope.vdbOrbit.vdbs, vdb);
                    });
                };

                // Initialise vdb collection on loading
                initVdbs();

            }
        ]);
    return vdbBench;

})(vdbBench || {});
