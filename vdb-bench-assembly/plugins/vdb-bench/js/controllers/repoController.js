var vdbBench = (function(vdbBench) {

    vdbBench.RepoController = vdbBench._module
            .controller(
                    'vdbBench.RepoController',
                    [
                            '$scope',
                            'repositoryService',
                            function($scope, repositoryService) {
                                // model variable, supplies initial selected value
                                $scope.selectedRepo = repositoryService.selected;

                                // Fetch the repositories from the service
                                $scope.repositories = function() {
                                    return repositoryService.repositories();
                                };

                                // On change of selection update the service
                                $scope.changeSelection = function(selectedRepo) {
                                    repositoryService.setSelected(selectedRepo);
                                };

                                // If the service changes its selection then it should notify
                                // this controller which at the moment will just log the call
                                $scope
                                        .$on(
                                                'selectedRepoChanged',
                                                function() {
                                                    console
                                                            .log("Receiving broadcast of selectionRepoChanged event from root scope");
                                                });
                            } ]);
    return vdbBench;

})(vdbBench || {});