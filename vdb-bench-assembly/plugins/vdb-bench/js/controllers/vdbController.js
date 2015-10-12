var vdbBench = (function (vdbBench) {

    vdbBench.VdbController = vdbBench._module.controller(
        'VdbController', ['$scope', 'RepoRestService', 'VdbSelectionService',
            function ($scope, RepoRestService, VdbSelectionService) {

                var DIAGRAM_TAB_ID = "Diagram";
                var PREVIEW_TAB_ID = "Preview";

                /**
                 * Fetch the list of vdbs from the selected repository
                 */
                function initVdbs() {
                    try {
                        RepoRestService.getVdbs().then(
                            function (newVdbs) {
                                RepoRestService.copy(newVdbs, $scope.vdbObject.vdbs);
                            },
                            function (response) {
                                // Some kind of error has occurred
                                $scope.vdbObject.vdbs = [];
                                throw new vdbBench.RestServiceException("Failed to load vdbs from the host services.\n" + response.message);
                            });
                    } catch (error) {
                        $scope.vdbObject.vdbs = [];
                        alert("An exception occurred:\n" + error.message);
                    }

                    // Removes any outdated vdb
                    VdbSelectionService.setSelected(null);
                }

                $scope.vdbObject = {};
                $scope.vdbObject.vdbs = [];
                $scope.vdbObject.previewRefresh = false;
                $scope.vdbObject.visibleTabId = DIAGRAM_TAB_ID;
                $scope.vdbObject.selectedVdbComponent = [];

                $scope.selected = function () {
                    return VdbSelectionService.selected();
                }

                $scope.select = function (vdb) {
                    VdbSelectionService.setSelected(vdb);
                }

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
                        $scope.vdbObject.vdbs = _.without($scope.vdbObject.vdbs, vdb);
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
                    if ($scope.vdbObject.visibleTabId == PREVIEW_TAB_ID)
                        VdbSelectionService.selectedXml();
                    else if ($scope.vdbObject.visibleTabId == DIAGRAM_TAB_ID)
                        VdbSelectionService.selectedContent();
                }

                $scope.$on('selectedVdbChanged', function () {
                    tabUpdate();
                    VdbSelectionService.selectedContent();
                });

                /**
                 * When the preview tab is selected, fetch the selected vdb xml
                 * and display it in the code mirror editor
                 */
                $scope.onTabSelected = function (tabId) {
                    // Stash the tab id for use with updating the preview tab
                    $scope.vdbObject.visibleTabId = tabId;

                    tabUpdate();

                    // This does not seem to work but leave it here for now
                    // and come back later
                    setTimeout(function () {
                        $scope.vdbObject.previewRefresh = !$scope.vdbObject.previewRefresh;
                    }, 2000);
                };

                // Initialise vdb collection on loading
                initVdbs();

            }
        ]);
    return vdbBench;

})(vdbBench || {});
