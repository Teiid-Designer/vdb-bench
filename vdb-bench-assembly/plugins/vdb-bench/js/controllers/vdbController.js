var vdbBench = (function (vdbBench) {

    vdbBench.VdbController = vdbBench._module.controller('VdbController',
                                                         ['$scope',
                                                          'RepoRestService',
                                                          'VdbSelectionService',
                                                          'SearchService',
                                                          'SYNTAX',
            function ($scope, RepoRestService, VdbSelectionService, SearchService, SYNTAX) {

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
                    // Set the selected vdb
                    //
                    VdbSelectionService.setSelected(vdb);
                };

                $scope.vdbOrbit.vdbSelected = function() {
                    return VdbSelectionService.selected();
                }

                $scope.searchOrbit = {};
                $scope.searchOrbit.searchTerm = '';
                $scope.searchOrbit.visible = false;

                $scope.searchOrbit.isVisible = function() {
                    return $scope.searchOrbit.visible;
                }

                $scope.searchOrbit.setVisible = function(visible) {
                    if ($scope.searchOrbit.visible == visible)
                        return;

                    $scope.searchOrbit.visible = visible;
                }

                $scope.searchOrbit.clear = function() {
                    $scope.searchOrbit.searchTerm = '';
                    SearchService.clearSearch();
                }
                
                $scope.searchOrbit.submit = function() {
                    if ($scope.searchOrbit.searchTerm == '')
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

                    SearchService.submitSearch($scope.searchOrbit.searchTerm);
                };

                /**
                 * Options for the codemirror editor used for previewing vdb xml
                 */
                $scope.xmlPreviewOptions = {
                    lineWrapping: true,
                    lineNumbers: true,
                    readOnly: 'nocursor',
                    mode: 'xml',
                };

                $scope.destroy = function (vdb) {
                    vdb.remove().then(function () {
                        $scope.vdbOrbit.vdbs = _.without($scope.vdbOrbit.vdbs, vdb);
                    });
                };

                /**
                 * Event handler for clicking the add button
                 */
                $scope.onAddClicked = function (event) {
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
                $scope.onRemoveClicked = function (event) {
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
                $scope.onTabSelected = function (tabId) {
                    // Stash the tab id for use with updating the preview tab
                    $scope.vdbOrbit.visibleTabId = tabId;

                    tabUpdate();

                    // This does not seem to work but leave it here for now
                    // and come back later
                    setTimeout(function () {
                        $scope.vdbOrbit.previewRefresh = !$scope.vdbOrbit.previewRefresh;
                    }, 2000);
                };

                // Initialise vdb collection on loading
                initVdbs();

            }
        ]);
    return vdbBench;

})(vdbBench || {});
