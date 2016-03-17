(function () {
    'use strict';

    var pluginName = 'vdb-bench.widgets';
    var pluginDirName = 'vdb-bench-widgets';

    angular
        .module(pluginName)
        .directive('repositoryControl', repositoryControl);

    repositoryControl.$inject = ['CONFIG', 'SYNTAX'];

    function repositoryControl(config, syntax) {
        var directive = {
            // used as element only
            restrict: 'E',
            // markup this directive generates
            templateUrl: config.pluginDir + syntax.FORWARD_SLASH +
                pluginDirName + syntax.FORWARD_SLASH +
                'repositoryControl.html',
            // isolated scope
            scope: {},
            bindToController: {
                edit: '='
            },
            controller: RepositoryController,
            // note: This would be 'ExampleController' (the exported controller name, as string)
            // if referring to a defined controller in its separate file.
            controllerAs: 'vm',
        };

        return directive;
    }

    RepositoryController.$inject = ['RepoSelectionService', '$scope'];

    function RepositoryController(RepoSelectionService, $scope) {
        var vm = this;

        // Use dot object to avoid javascript scope issue
        vm.repo = {};

        // model variable, supplies initial selected value
        vm.repo.selected = RepoSelectionService.getSelected();

        // Fetch the repositories from the service
        vm.repositories = function () {
            return RepoSelectionService.getWorkspaces();
        };

        // On change of selection update the service
        vm.changeSelection = function (selectedRepo) {
            RepoSelectionService.setSelected(selectedRepo);
        };

        // Is a repository selected
        vm.isWorkspaceSelected = function () {
            return RepoSelectionService.isWorkspaceSelected();
        };

        // Is localhost repository selected
        vm.isDefaultSelected = function () {
            return RepoSelectionService.isDefaultSelected();
        };

        // Event handler for clicking the add button
        vm.onAddClicked = function () {
            RepoSelectionService.newWorkspace();
        };

        // Event handler for clicking the remove button
        vm.onRemoveClicked = function () {
            RepoSelectionService.removeSelected();
        };

        // If the service changes its selection then it
        // should notify this controller
        $scope.$on('selectedRepoChanged', function () {
            // Refresh the selected repo field to in turn refresh
            // any controls depending on it.
            if (vm.repo.selected != RepoSelectionService.getSelected())
                vm.repo.selected = RepoSelectionService.getSelected();
        });
    }
})();