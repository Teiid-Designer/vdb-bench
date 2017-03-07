(function () {
    'use strict';

    var pluginDirName = 'vdb-bench-dataservice';
    var pluginName = 'vdb-bench.dataservice';
    var exportDir = 'export';

    angular
        .module(pluginName)
        .directive('dsExportGitWizard', DSExportGitWizard);

    DSExportGitWizard.$inject = ['CONFIG', 'SYNTAX'];
    DSExportGitWizardController.$inject = ['$scope', 
                                           '$base64',
                                           '$translate',
                                           'SYNTAX', 
                                           'DSSelectionService', 
                                           'RepoRestService'];

    function DSExportGitWizard(config, syntax) {
        var directive = {
            restrict: 'E',
            scope: {},
            bindToController: {
                'wizardActive': '=',
                'repo': '='
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

    function DSExportGitWizardController($scope, 
                                         $base64,
                                         $translate,
                                         syntax, 
                                         DSSelectionService, 
                                         RepoRestService) {
        var vm = this;

        vm.requireAuthorName = false;
        vm.requireEmailName = false;
        vm.inProgress = false;
        vm.response = '';
 
        function setError(message) {
            if (message) {
                message = message.replace(/<br\/>/g, syntax.NEWLINE);
            }

            vm.error = message;
        }

        vm.exportFailure = function() {
            return !vm.inProgress && vm.response === 'Failed';
        };

        vm.exportSuccess = function() {
            return !vm.inProgress && vm.response === 'OK';
        };

        vm.dataServiceName = function() {
            var dataService = DSSelectionService.selectedDataService();
            return dataService.keng__id;
        };

        function setResponse(response) {
            vm.response = response;
            var dataService = DSSelectionService.selectedDataService();

            if (response === 'OK') {
                vm.responseMsg = $translate.instant( 'dsExportGitWizard.successfulExportDetailMsg', 
                                                     { dataServiceName: dataService.keng__id, 
                                                       repoPath: vm.repo.parameters[ 'file-path-property' ] } );
            } else {
                vm.responseMsg = $translate.instant( 'dsExportGitWizard.failedExportDetailMsg', 
                                                     { dataServiceName: dataService.keng__id,
                                                       repoPath: vm.repo.parameters[ 'file-path-property' ] } );
            }
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

        /**
         * Returns 'true' if the repository properties are valid; otherwise 'false'.
         */
        vm.validateRepoProps = function() {
            if (_.isEmpty(vm.repo))
                return false;

            if (_.isEmpty(vm.repo.parameters))
                return false;

            if (_.isEmpty(vm.repo.name))
                return false;

            if (_.isEmpty(vm.repo.parameters['repo-path-property'])) {
                return false;
            }

            if (_.isEmpty(vm.repo.parameters['file-path-property'])) {
                return false;
            }

            if ( vm.requireAuthorName && 
                 _.isEmpty( vm.repo.parameters[ 'author-name-property' ] ) ) {
                return false;
            }

            if ( vm.requireAuthorEmail && 
                 _.isEmpty( vm.repo.parameters[ 'author-email-property' ] ) ) {
                return false;
            }

            return true;
        };

        /**
         * Returns 'true' if the authentication settings are valid; otherwise 'false'.
         */
        vm.validateAuthentication = function() {
            return true; // no validation needed
        };

        //
        // Validates the repository properties and the authentication settings.
        // Returns 'true' if valid; otherwise 'false'.
        //
        vm.validateCredentials = function() {
            return vm.validateRepoProps && vm.validateAuthentication;
        };

        vm.showProgress = function(display) {
            vm.inProgress = display;
        };

        $scope.$on( "wizard:stepChanged", function ( e, parameters ) {
            if ( parameters.step.stepId == 'data-service-export-progress-final' ) {
                exportDataService();
            }
        });

        function exportDataService() {
            var dataservice = DSSelectionService.selectedDataService();

            // Display the progress bar
            vm.showProgress(true);

            try {
                RepoRestService.export('git', vm.repo.parameters, dataservice).then(
                    function (exportStatus) {
                        vm.showProgress(false);
                        setResponse(exportStatus.success ? 'OK': 'Failed');

                        if ( exportStatus.success === 'OK' ) {
                            setError( null );
                        } else {
                            var msg = $translate.instant( 'dsExportGitWizard.failedNoDetailsMsg', 
                                                          { dataServiceName: dataservice.keng__id } );
                            setError( msg );
                        }
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
        }
    }
})();
