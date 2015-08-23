var vdbBench = (function (vdbBench) {

    vdbBench.VdbController = vdbBench._module.controller(
        'VdbController', ['$scope', 'RepoRestService', '$filter',
            function ($scope, RepoRestService, $filter) {

                var DIAGRAM_TAB_ID = "Diagram";
                var PREVIEW_TAB_ID = "Preview";

                function RestServiceException(message) {
                    this.message = message;
                    this.toString = function () {
                        return this.message;
                    };
                }

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
                                throw new RestServiceException("Failed to load vdbs from the host services.\n" + response.message);
                            });
                    } catch (error) {
                        $scope.vdbObject.vdbs = [];
                        alert("An exception occurred:\n" + error.message);
                    }
                }

                $scope.vdbObject = {};
                $scope.vdbObject.vdbs = [];
                $scope.vdbObject.previewRefresh = false;
                $scope.vdbObject.visibleTabId = DIAGRAM_TAB_ID;

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
                 * When the repository is changed re-initialise the vdb list
                 */
                $scope.$on('selectedRepoChanged', function () {
                    initVdbs();
                });

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
                    var selected = $scope.vdbObject.selected;
                    try {
                        RepoRestService.removeVdb(selected).then(
                            function () {
                                // Reinitialise the list of vdbs
                                initVdbs();
                            },
                            function (response) {
                                throw new RestServiceException("Failed to remove the vdb " + selected.id + "from the host services.\n" + response.message);
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
                        $scope.vdbXml();
                    else if ($scope.vdbObject.visibleTabId == DIAGRAM_TAB_ID)
                        $scope.vdbContent();
                }

                /**
                 * Watch the selected vdb and update content based on the new selection
                 */
                $scope.$watch('vdbObject.selected', function (newValue, oldValue) {
                    if (newValue == oldValue)
                        return;

                    tabUpdate();
                }, true);

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

                /**
                 * Retrieve the contents of the vdb (in json)
                 */
                $scope.vdbContent = function () {
                    if ($scope.vdbObject.selected == null)
                        return null;

                    try {
                        RepoRestService.getVdbContent($scope.vdbObject.selected).then(
                            function (content) {
                                $scope.vdbObject.vdbContent = content;
                            },
                            function (response) {
                                throw new RestServiceException("Failed to retrieve the content of the vdb " + selected.id + "from the host services.\n" + response.message);
                            });
                    } catch (error) {
                        throw new RestServiceException("Failed to retrieve the content of the selected vdb from the host services.\n" + error.message);
                    }
                }

                /**
                 * Retrieve the vdb xml for the selected vdb
                 */
                $scope.vdbXml = function () {
                    try {
                        $scope.vdbObject.previewContent = "Loading ...";

                        RepoRestService.getVdbXml($scope.vdbObject.selected).then(
                            function (xml) {
                                $scope.vdbObject.previewContent = $filter('prettyXml')(xml);
                            },
                            function (response) {
                                $scope.vdbObject.previewContent = "Error occurred: ", response.message;
                            });
                    } catch (error) {
                        $scope.vdbObject.previewContent = "Error occurred: " + error.message;
                    }
                };

                // Initialise vdb collection on loading
                initVdbs();

            }
        ]);
    return vdbBench;

})(vdbBench || {});
