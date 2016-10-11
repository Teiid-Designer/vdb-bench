(function () {
    'use strict';

    var pluginDirName = 'vdb-bench-dataservice';
    var pluginName = 'vdb-bench.dataservice';
    var exportDir = 'export';

    angular
        .module(pluginName)
        .directive('dsExportGitWizard', DSExportGitWizard);

    DSExportGitWizard.$inject = ['CONFIG', 'SYNTAX'];
    DSExportGitWizardController.$inject = ['$window', '$scope', '$base64', 'SYNTAX', 'DSSelectionService', 'RepoRestService'];

    function DSExportGitWizard(config, syntax) {
        var directive = {
            restrict: 'E',
            scope: {},
            bindToController: {
                'wizardActive': '='
            },
            controller: DSExportGitWizardController,
            controllerAs: 'vm',
            templateUrl: config.pluginDir + syntax.FORWARD_SLASH +
                pluginDirName + syntax.FORWARD_SLASH +
                exportDir + syntax.FORWARD_SLASH +
                'git-export-wizard.html'
        };

        return directive;
    }

    function DSExportGitWizardController($window, $scope, $base64, syntax, DSSelectionService, RepoRestService) {
        var vm = this;

        /**
         * Final location of all the parameters
         * populated by the wizard
         */
        vm.repo = {
            parameters: {}
        };

        function setError(message) {
            if (message) {
                message = message.replace(/<br\/>/g, syntax.NEWLINE);
            }

            vm.error = message;
        }

        function setResponse(response) {
            vm.response = response;
            if (response === 'OK')
                vm.responseStyleClass = "ds-export-git-page-response-ok";
            else
                vm.responseStyleClass = "ds-export-git-page-response-bad";
        }

        /**
         * The git repository has been changed in the repository selection control
         */
        vm.onRepoSelection = function(selected) {
            if (!selected) {
                vm.repo = {
                    parameters: {}
                };
                return;
            } else {
                vm.repo = selected;
            }
        };

        //
        // Validates the credentials wizard step and returns true is ok to continue or
        // false if validation has failed
        //
        vm.validateCredentials = function() {
            if (_.isEmpty(vm.repo))
                return false;

            if (_.isEmpty(vm.repo.parameters))
                return false;

            if (_.isEmpty(vm.repo.parameters['repo-path-property'])) {
                alert("The repository URL is required");
                return false;
            }

            if (_.isEmpty(vm.repo.parameters['file-path-property'])) {
                alert("The relative file path property is required");
                return false;
            }

            return true;
        };

        vm.showProgress = function(display) {
            vm.inProgress = display;
        };

        /**
         * Event handler for exporting the dataservice to git repository
         */
        vm.onExportDataServiceClicked = function() {
            var dataservice = DSSelectionService.selectedDataService();

            //
            // Display the progress bar and hide the browse button
            //
            vm.showProgress(true);

            try {
                RepoRestService.export('git', vm.repo.parameters, dataservice).then(
                    function (exportStatus) {
                        vm.showProgress(false);
                        setError(null);
                        setResponse(exportStatus.success ? 'OK': 'Failed');
                    },
                    function (response) {
                        // Some kind of error has occurred
                        vm.showProgress(false);
                        setError(RepoRestService.responseMessage(response));
                        setResponse('Failed');
                    });
            } catch (error) {
                vm.showProgress(false);
                setError(error.message);
                setResponse('Failed');
            }
        };
    }
})();
