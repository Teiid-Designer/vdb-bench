(function () {
    'use strict';

    var pluginDirName = 'vdb-bench-dataservice';
    var pluginName = 'vdb-bench.dataservice';
    var importDir = 'import';

    angular
        .module(pluginName)
        .directive('dsImportGitWizard', DSImportGitWizard);

    DSImportGitWizard.$inject = ['CONFIG', 'SYNTAX'];
    DSImportGitWizardController.$inject = ['$window', '$scope', '$base64', 'SYNTAX', 'DSSelectionService', 'RepoRestService'];

    function DSImportGitWizard(config, syntax) {
        var directive = {
            restrict: 'E',
            scope: {},
            bindToController: {
                'wizardActive': '='
            },
            controller: DSImportGitWizardController,
            controllerAs: 'vm',
            templateUrl: config.pluginDir + syntax.FORWARD_SLASH +
                pluginDirName + syntax.FORWARD_SLASH +
                importDir + syntax.FORWARD_SLASH +
                'git-import-wizard.html'
        };

        return directive;
    }

    function DSImportGitWizardController($window, $scope, $base64, syntax, DSSelectionService, RepoRestService) {
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
                vm.responseStyleClass = "ds-import-git-page-response-ok";
            else
                vm.responseStyleClass = "ds-import-git-page-response-bad";
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

            var filePath = vm.repo.parameters['file-path-property'];
            if (_.isEmpty(filePath)) {
                alert("The relative file path property is required");
                return false;
            }

            vm.documentType = RepoRestService.documentType(filePath);
            if (vm.documentType === null) {
                alert(filePath + "'s file type is not valid hence the file cannot be imported.");
                return false;
            }

            return true;
        };

        vm.showProgress = function(display) {
            vm.inProgress = display;
        };

        /**
         * Event handler for importing the dataservice to git repository
         */
        vm.onImportDataServiceClicked = function() {
            var dataservice = DSSelectionService.selectedDataService();

            //
            // Display the progress bar and hide the browse button
            //
            vm.showProgress(true);

            try {
                RepoRestService.import('git', vm.repo.parameters, vm.documentType).then(
                    function (importStatus) {
                        vm.showProgress(false);
                        setError(null);
                        setResponse(importStatus.success ? 'OK': 'Failed');

                        // Reinitialise the list of dataservices
                        DSSelectionService.refresh();
                    },
                    function (response) {
                        // Some kind of error has occurred
                        vm.showProgress(false);
                        setError(RepoRestService.reponseMessage(response));
                        setResponse('Failed');

                        // Reinitialise the list of dataservices
                        DSSelectionService.refresh();
                    });
            } catch (error) {
                vm.showProgress(false);
                setError(error.message);
                setResponse('Failed');
            }
        };
    }
})();
