var vdbBench = (function(vdbBench) {

    vdbBench.RepoController = vdbBench._module
            .controller(
                    'RepoController',
                    [
                            '$scope',
                            'RepoSelectionService',
                            function($scope, RepoSelectionService) {

                                var repoEditBaseConfig = {
                                        "id" : 'repoEditForm',
                                        "style" : HawtioForms.FormStyle.HORIZONTAL,
                                        "mode" : HawtioForms.FormMode.EDIT,
                                        "disableHumanizeLabel" : false,
                                        "hideLegend" : false,
                                        "controls" : [ "*" ],
                                        "properties" : {
                                            "hostname" : {
                                                type : 'text',
                                                'input-attributes' : {
                                                    'required' : 'true',
                                                }
                                            },
                                            "port" : {
                                                "type": "Integer",
                                                "input-attributes": {
                                                    'required' : 'true',
                                                    'min' : 1000,
                                                    'max' : 65535
                                                }
                                            }
                                        },
                                        "description" : "Repository Properties",
                                        "type" : "java.lang.String"
                                    };

                                // Use dot object to avoid javascript scope issue
                                $scope.repo = {};

                                // model variable, supplies initial selected value
                                $scope.repo.selected = RepoSelectionService.getSelected();

                                // Watch the selectedRepo so that if its properties change
                                // they need to be preserved by the repository service
                                $scope.$watch('repo.selected', function(newValue, oldValue) {
                                    RepoSelectionService.saveRepositories();
                                }, true);

                                // Fetch the repositories from the service
                                $scope.repositories = function() {
                                    return RepoSelectionService.getRepositories();
                                };

                                // On change of selection update the service
                                $scope.changeSelection = function(selectedRepo) {
                                    RepoSelectionService.setSelected(selectedRepo);
                                };

                                // Is a repository selected
                                $scope.isRepositorySelected = function() {
                                    return RepoSelectionService
                                            .isRepositorySelected();
                                }

                                // Is localhost repository selected
                                $scope.isLocalhostSelected = function() {
                                    return RepoSelectionService
                                            .isLocalhostSelected();
                                }

                                function getRepoEditConfig() {
                                    var repoEditConfig = _.clone(repoEditBaseConfig, true);
                                    var hostNameExt = {
                                            "properties" : {
                                                "hostname" : {
                                                    type : 'text',
                                                    'input-attributes' : {
                                                        'required' : 'true',
                                                        'readOnly' : 'true'
                                                    }
                                                }
                                            }
                                        };

                                    if (RepoSelectionService.isLocalhostSelected()) {
                                        repoEditConfig = _.merge(repoEditConfig, hostNameExt);
                                    }

                                    return repoEditConfig;
                                };

                                $scope.repo.editConfig = getRepoEditConfig();

                                // If the service changes its selection then it
                                // should notify this controller
                                $scope
                                        .$on(
                                                'selectedRepoChanged',
                                                function() {

                                                    // Refresh the selected repo field to in turn refresh
                                                    // any controls depending on it.
                                                    if ($scope.repo.selected != RepoSelectionService.getSelected())
                                                        $scope.repo.selected = RepoSelectionService.getSelected();

                                                    $scope.repo.editConfig = getRepoEditConfig();
                                                });

                                // Event handler for clicking the add button
                                $scope.onAddClicked = function() {
                                    RepoSelectionService.newRepository();
                                };

                                // Event handler for clicking the remove button
                                $scope.onRemoveClicked = function() {
                                    RepoSelectionService.removeSelected();
                                };

                            } ]);
    return vdbBench;

})(vdbBench || {});