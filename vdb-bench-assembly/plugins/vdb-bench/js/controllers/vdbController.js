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
                $scope.searchOrbit.searchTerms = {};
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

                function doSubmit(searchTerms, searchSavedName, parameters) {
                    var terms = angular.copy(searchTerms);
                    if (! _.isEmpty(searchSavedName))
                        terms[REST_URI.SEARCH_SAVE_NAME] = searchSavedName;

                    if (! _.isEmpty(parameters))
                        terms[REST_URI.SEARCH_PARAMETERS] = parameters;

                    RepoRestService.search(terms).then(
                        function (results) {
                            if (_.isEmpty(results)) {
                                $scope.searchOrbit.results = [];
                                $scope.searchOrbit.results[0] = {};
                                $scope.searchOrbit.results[0][VDB_KEYS.ID] = "No search results found";
                            }
                            else
                                $scope.searchOrbit.results = results;

                            // Reset the search term name to allow future calls to doSubmit
                            delete $scope.searchOrbit.searchTerms[REST_URI.SEARCH_SAVE_NAME];
                        },
                        function (response) {
                            var msg = "";
                            if (response.config)
                                msg = "url : " + response.config.url + SYNTAX.NEWLINE;

                            msg = msg + "status : " + response.status + SYNTAX.NEWLINE;
                            msg = msg + "data : " + response.data.Error + SYNTAX.NEWLINE;
                            msg = msg + "status message : " + response.statusText + SYNTAX.NEWLINE;

                            $scope.searchOrbit.results = [];
                            $scope.searchOrbit.results[0] = {};
                            $scope.searchOrbit.results[0][VDB_KEYS.ID] = "Error occurred while searching the repository:\n" + msg;
                        }
                    );
                }

                function findSearchTermParameters(searchTerms) {
                    var termTypes = [REST_URI.SEARCH_CONTAINS,
                                                REST_URI.SEARCH_TYPE,
                                                REST_URI.SEARCH_PATH,
                                                REST_URI.SEARCH_PARENT,
                                                REST_URI.SEARCH_OBJECT_NAME];

                    var params = [];
                    for (var i = 0; i < termTypes.length; ++i) {
                        var termType = termTypes[i];
                        var term = searchTerms[termType];
                        if (!_.isEmpty(term) && _.startsWith(term, SYNTAX.OPEN_BRACE) && _.endsWith(term, SYNTAX.CLOSE_BRACE)) {
                            params.push(term.substring(1, term.length - 1));
                        }
                    }

                    return params;
                }

                function requestParametersAndSearch(searchSaveName, parameters) {
                    //
                    // Require values for the parameters before sending the query
                    //
                    var modalTemplate = '<div class="modal-header">' +
                                                     '<h3 class="modal-title">Provide values for the following search parameters</h3>' +
                                                     '</div>' +
                                                     '<div class="modal-body">';

                    for (var i = 0; i < parameters.length; ++i) {
                        var param = parameters[i];
                        modalTemplate = modalTemplate + '<div class="form-group">';
                        modalTemplate = modalTemplate + '<label for="' + param + '">' + param + '</label>';
                        modalTemplate = modalTemplate + '<input type="text" class="form-control" id=' + param + ' ng-model="parameters.' + param + '"/>';
                        modalTemplate = modalTemplate + "</div>";
                    }

                    modalTemplate = modalTemplate + '</div>' +
                                                         '<div class="modal-footer">' +
                                                         '<button class="btn btn-primary" ng-click="ok()">OK</button>' +
                                                         '<button class="btn btn-warning" ng-click="cancel()">Cancel</button>' +
                                                         '</div>';

                    var modal = $modal.open( {
                        animation: 'true',
                        backdrop: 'false',
                        template: modalTemplate,
                        controller: ['$scope', '$modalInstance', function ($scope, $modalInstance) {
                            $scope.parameters = {};

                            $scope.ok = function() {
                                $modalInstance.close($scope.parameters);
                            };
                            $scope.cancel = function() {
                                $modalInstance.dismiss('cancel');
                            }
                        }]
                    });

                    //
                    // If modal ok clicked then run the search
                    //
                    modal.result.then(
                        function (parameterValues) {
                            doSubmit($scope.searchOrbit.searchTerms, searchSaveName, parameterValues);
                        },
                        function () {
                            // Cancel was called but need to reset the search name to allow future calls of submit()
                        }
                    );
                }

                $scope.searchOrbit.submit = function(searchSaveName) {
                    if (_.isEmpty($scope.searchOrbit.searchTerms) && _.isEmpty(searchSaveName))
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

                    var parameters = findSearchTermParameters($scope.searchOrbit.searchTerms);
                    if (_.isEmpty(parameters))
                        doSubmit($scope.searchOrbit.searchTerms, searchSaveName, parameters);
                    else
                        requestParametersAndSearch(searchSaveName, parameters);
                };

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
                        if (_.isEmpty($scope.searchOrbit.searchTerms))
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
                                var terms = angular.copy($scope.searchOrbit.searchTerms);
                                terms[REST_URI.SEARCH_SAVE_NAME] = searchName;

                                //
                                // Call the rest service to post the new search
                                //
                                RepoRestService.saveSearch(terms).then(
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

                /**
                 * Fetch the list of search reports from the selected repository
                 */
                function initReports() {
                    $scope.reportOrbit.reports = [];

                    try {
                        RepoRestService.getSearches().then(
                            function (newSearches) {
                                RepoRestService.copy(newSearches, $scope.reportOrbit.reports);
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

                        //
                        // Display the search results pane
                        //
                        $scope.searchOrbit.setVisible(true);
                    }

                    //
                    // Stash the selected report
                    //
                    $scope.reportOrbit.selectedReport = report;

                    if (! report)
                        return;

                    $scope.searchOrbit.searchTerms = {};
                    if (! _.isEmpty(report[REST_URI.SEARCH_PARAMETERS]))
                        requestParametersAndSearch(report.name, report[REST_URI.SEARCH_PARAMETERS]);
                    else
                        doSubmit($scope.searchOrbit.searchTerms, report.name);
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
