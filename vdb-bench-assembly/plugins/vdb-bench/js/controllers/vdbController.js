var vdbBench = (function(vdbBench) {

    vdbBench.VdbController = vdbBench._module.controller(
            'VdbController', [
                    '$scope',
                    'RepoRestService',
                    function($scope, RepoRestService) {

                        $scope.vdbObject = {};
                        $scope.vdbObject.vdbs = [];

                        function initVdbs() {
                            try {
                                RepoRestService.getVdbs().then(
                                        function(newVdbs) {
                                            RepoRestService.copy(newVdbs, $scope.vdbObject.vdbs);
                                        },
                                        function(response) {
                                            // Some kind of error has occurred
                                            $scope.vdbObject.vdbs = [];
                                            // TODO better error handler
                                            console.log("Error with status code", response.status);
                                        });
                            } catch (error) {
                                $scope.vdbObject.vdbs = [];
                                alert("An exception occurred:\n" + error.message);
                            }
                        }

                        $scope.destroy = function(vdb) {
                            vdb.remove().then(function() {
                                $scope.vdbObject.vdbs = _.without($scope.vdbObject.vdbs, vdb);
                            });
                        };

                        $scope.$on('selectedRepoChanged', function() {
                            initVdbs();
                        });

                        // Event handler for clicking the add button
                        $scope.onAddClicked = function(event) {
                            try {
                                $window.alert("To be implemented");
                            } catch (error) {

                            } finally {
                                // Essential to stop the accordion closing
                                event.stopPropagation();
                            }
                        };

                        // Event handler for clicking the remove button
                        $scope.onRemoveClicked = function(event) {
                            try {
                                RepoRestService.removeVdb($scope.vdbObject.selected).then(
                                        function() {
                                            console.log("Removed vdb");
                                            initVdbs();
                                        }, function(response) {
                                            // TODO better error handler
                                            console.log("Error with status code", response.status);
                                        });
                            } catch (error) {
                            } finally {
                                // Essential to stop the accordion closing
                                event.stopPropagation();
                            }
                        };

                        // Initialise vdb collection on loading
                        initVdbs();

                    } ]);
    return vdbBench;

})(vdbBench || {});