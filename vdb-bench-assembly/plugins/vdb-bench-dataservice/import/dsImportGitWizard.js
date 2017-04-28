(function () {
    'use strict';

    var pluginDirName = 'vdb-bench-dataservice';
    var pluginName = 'vdb-bench.dataservice';
    var importDir = 'import';

    angular
        .module(pluginName)
        .directive('dsImportGitWizard', DSImportGitWizard);

    DSImportGitWizard.$inject = ['CONFIG', 'SYNTAX'];
    DSImportGitWizardController.$inject = ['$window', 
                                           '$scope', 
                                           '$base64',
                                           '$translate',
                                           '$sce',
                                           'SYNTAX', 
                                           'DSSelectionService', 
                                           'RepoRestService'];

    function DSImportGitWizard(config, syntax) {
        var directive = {
            restrict: 'E',
            scope: {},
            bindToController: {
                'wizardActive': '=',
                'repo': '='
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

    function DSImportGitWizardController($window, 
                                         $scope, 
                                         $base64, 
                                         $translate,
                                         $sce,
                                         syntax, 
                                         DSSelectionService, 
                                         RepoRestService) {
        var vm = this;

        vm.requireAuthorName = false;
        vm.requireEmailName = false;
        vm.showDetails = false;
        vm.showDetailsToggle = true;
        vm.detailsToggleTitle = $translate.instant("dsImportGitWizard.showErrorDetailTitle");
        vm.overwriteAllowed = false;

        /**
         * Final location of all the parameters
         * populated by the wizard
         */
        vm.repo = {
            parameters: {}
        };

        function setErrorDetail(message) {
            vm.error = $sce.trustAsHtml(message);
        }

        /**
         * Toggles display of the error details
         */
        vm.toggleDetails = function() {
            vm.showDetails = !vm.showDetails;
            if(vm.showDetails) {
                vm.detailsToggleTitle = $translate.instant("dsImportGitWizard.hideErrorDetailTitle");
            } else {
                vm.detailsToggleTitle = $translate.instant("dsImportGitWizard.showErrorDetailTitle");
            }
        };

        vm.importFailure = function() {
            return !vm.inProgress && vm.response !== 'OK';
        };

        vm.importSuccess = function() {
            return !vm.inProgress && vm.response === 'OK';
        };

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
         * This needs to stay in sync with gitCredentialsControl validation.
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

            var filePath = vm.repo.parameters['file-path-property'];
            if ( _.isEmpty(filePath) ||
                 filePath.includes( "//" ) ||
                 filePath.includes( "\\" ) ||
                 filePath == "/" ) {
                alert($translate.instant('dsImportGitWizard.missingPathMsg'));
                return false;
            }

            vm.documentType = RepoRestService.documentType(filePath);
            if (vm.documentType === null) {
                if (! filePath.includes(syntax.DOT)) {
                    // assume the file is a directory and will be imported as a zip
                    vm.documentType = RepoRestService.validDocumentTypes.ZIP;
                } else {
                    alert($translate.instant('dsImportGitWizard.invalidFileTypeMsg', {fileName: filePath}));
                    return false;
                }
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
         * Returns full target URL including branch and folder
         */
        vm.repoTargetUrl = function() {
            // git path propery (ends with .git)
            var gitUrl = vm.repo.parameters['repo-path-property'];

            // if path ends with .git, it is removed.  Then /tree/ is appended.
            var baseUrl = gitUrl.replace(".git","").concat("/tree/");

            // Add the branch name to the url
            var branch = vm.repo.parameters['repo-branch-property'];
            if( !branch || branch.length === 0 ) {
                branch = 'master';
            }

            var folder = vm.repo.parameters['file-path-property'];

            return baseUrl.concat(branch).concat("/"+folder);
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
            if ( parameters.step.stepId == 'data-service-import-progress-final' ) {
                importDataService();
            }
        });

        /**
         * Function for import of the dataservice from git repository
         */
        function importDataService() {
            //
            // Display the progress bar and hide the browse button
            //
            vm.showProgress(true);
            vm.showDetailsToggle = true;

            try {
                RepoRestService.import('git', "", vm.repo.parameters, vm.overwriteAllowed, vm.documentType).then(
                    function (importStatus) {
                        vm.showProgress(false);
                        vm.response = importStatus.success ? 'OK': 'Failed';

                        if ( vm.response === 'OK' ) {
                            if(importStatus.message) {
                                vm.responseMsg = importStatus.message;
                            } else {
                                vm.responseMsg = $translate.instant( 'dsImportGitWizard.successfulImportDetailMsg' );
                            }
                            setErrorDetail( null );
                        } else {
                            vm.responseMsg = $translate.instant( 'dsImportGitWizard.failedImportDetailMsg' );
                            if(importStatus.message) {
                                setErrorDetail(importStatus.message);
                            } else {
                                setErrorDetail( $translate.instant( 'dsImportGitWizard.failedNoDetailsMsg' ) );
                            }
                        }
                    },
                    function (response) {
                        // Some kind of error has occurred
                        vm.showProgress(false);
                        vm.response = 'Failed';
                        if(response.data && response.data.error) {
                            var nodeExists = 'The node already exists';
                            if(response.data.error.includes(nodeExists)) {
                                vm.showDetailsToggle = false;
                                var wontImport = 'will not import';
                                var startIndx = response.data.error.indexOf(wontImport) + wontImport.length;
                                var endIndx = response.data.error.indexOf(nodeExists);
                                var name = response.data.error.substring(startIndx,endIndx-3).trim().replace(/\"/g,"");
                                vm.responseMsg = $translate.instant( 'dsImportGitWizard.failedImportNodeExistsDetailMsg', 
                                        { dsName: name,
                                          repoPath: vm.repo.parameters[ 'repo-path-property' ] } );
                                setErrorDetail(null);
                            } else {
                                vm.responseMsg = $translate.instant( 'dsImportGitWizard.failedImportDetailMsg', 
                                        { repoPath: vm.repo.parameters[ 'repo-path-property' ] } );
                                setErrorDetail(response.data.error);
                            }
                        } else {
                            vm.responseMsg = $translate.instant( 'dsImportGitWizard.failedImportDetailMsg', 
                                    { repoPath: vm.repo.parameters[ 'repo-path-property' ] } );
                            setErrorDetail(RepoRestService.responseMessage(response));
                        }
                    });
            } catch (error) {
                vm.showProgress(false);
                vm.response = 'Failed';
                vm.responseMsg = $translate.instant( 'dsImportGitWizard.failedImportDetailMsg', 
                        { repoPath: vm.repo.parameters[ 'repo-path-property' ] } );
                setErrorDetail(error.message);
            }
        }
    }
})();
