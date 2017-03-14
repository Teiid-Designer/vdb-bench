(function () {
    'use strict';

    var pluginName = 'vdb-bench.widgets';
    var pluginDirName = 'vdb-bench-widgets';

    var BASE_NAME = 'git-repo-';
    var GIT_REPOS_KEY = 'git-repositories';
    var SELECTED_GIT_REPO_KEY = 'selectedGitRepoName';

    angular
        .module(pluginName)
        .directive('gitCredentialsControl', GitCredentialsControl);

    GitCredentialsControl.$inject = ['CONFIG', 'SYNTAX'];
    GitCredentialsControlController.$inject = ['$translate', 
                                               'StorageService', 
                                               '$scope', 
                                               '$base64', 
                                               '$window'];

    function GitCredentialsControl(config, syntax) {
        var directive = {
            restrict: 'E',
            scope: {},
            bindToController: {
                repo: '=?',
                edit: '=',
                showName: '=',
                showFilePath: '=',
                showRepoProps: '=',
                showSecurityAttributes: '=',
                requireAuthorName: '=',
                requireAuthorEmail: '=',
                onSelection: '&'
            },
            controller: GitCredentialsControlController,
            controllerAs: 'vm',
            templateUrl: config.pluginDir + syntax.FORWARD_SLASH +
                pluginDirName + syntax.FORWARD_SLASH +
                'gitCredentialsControl.html'
        };

        return directive;
    }

    function GitCredentialsControlController($translate, 
                                             StorageService, 
                                             $scope, 
                                             $base64, 
                                             $window) {
        var vm = this;

        var defaultRepo = {
            name: 'git-repo-1',
            parameters: {
                'repo-path-property' : '', /* URL Location */
                'repo-branch-property' : '', /* Branch of the repository */
                'file-path-property' : '', /* relative location of the file to be imported/exported - not being filled in through preferences */
                'author-name-property' : '', /* name of the author to be used for committing to repository */
                'author-email-property' : '', /* email of the author to be used for committing to repository */
                /* SSH */
                'repo-known-hosts-property' : '', /* value of known hosts file to be transmitted - not being filled in through preferences */
                'repo-private-key-property' : '', /* value of private key to be transmitted - not being filled in through preferences */
                'repo-passphrase-property' : '', /* passphrase of ssh key */
                /* SSH and HTTP */
                'repo-password-property' : '', /* password used for standard authentication */
                /* HTTP */
                'repo-username-property' : '' /* username used for standard http authentication */
            }
        };

        /*
         * Initialising the repositories from local storage
         */
        function initRepositories() {
            vm.repositories = StorageService.getObject(GIT_REPOS_KEY, []);
            if (_.isEmpty(vm.repositories)) {
                vm.repositories = [defaultRepo];
                StorageService.setObject(GIT_REPOS_KEY, vm.repositories);
            }

            if ( _.isEmpty( vm.repo ) || _.isEmpty( vm.repo.name ) ) {
                vm.setSelected( vm.repositories[ 0 ] );
            }
        }

        function newRepository() {
            var newRepo = null;
            var index = 1;

            while (!newRepo) {
                var testName = BASE_NAME + index;
                var exists = false;

                for (var i = 0; i < vm.repoCount(); ++i) {
                    if (vm.repositories[i].name == testName) {
                        exists = true;
                        break;
                    }
                }

                if (!exists) {
                    newRepo = {
                        name: testName,
                        parameters: {}
                    };
                   newRepo.parameters = _.clone(defaultRepo.parameters);
                } else
                    index++;
            }

            // Add the new repository to the collection
            if (angular.isUndefined(vm.repositories))
                vm.repositories = [];

            vm.repositories.push(newRepo);

            // Set the selected to the new repository
            vm.setSelected(newRepo);
        }

        vm.setSelected = function(selected) {
            vm.repo = selected;
            vm.changeSelection(vm.repo);
        };

        // Save the repositories
        vm.saveRepositories = function() {
            var repos = _.cloneDeep(vm.repositories);
            for (var i = 0; i < repos.length; ++i) {
                var repo = repos[i];
                //
                // Due to local storage not being secure, these should not be stored
                //
                delete repo.parameters['repo-known-hosts-property'];
                delete repo.parameters['repo-private-key-property'];
                delete repo.parameters['repo-passphrase-property'];
                delete repo.parameters['repo-password-property'];
            }

            StorageService.setObject(GIT_REPOS_KEY, repos);

            //
            // Need to save as well since the name of the selected repository
            // may have been edited. Ensures that next time of loading the 'new'
            // name is used to select the correct repository
            //
            var name = _.isEmpty(vm.repo) ? '' : vm.repo.name;
            StorageService.set(SELECTED_GIT_REPO_KEY, name);
        };

        // Count of the repositories
        vm.repoCount = function() {
            if (angular.isUndefined(vm.repositories))
                return 0;

           return vm.repositories.length;
        };

        // Is a repository selected
        vm.isRepoSelected = function () {
            return angular.isDefined(vm.repo);
        };

        // On change of selection update the external callback
        vm.changeSelection = function (selected) {
            if (angular.isDefined(vm.onSelection))
                vm.onSelection({selected : selected});
        };

        // Event handler for clicking the add button
        vm.onAddClicked = function () {
            newRepository();
            vm.saveRepositories();
        };

        // Event handler for clicking the remove button
        vm.onRemoveClicked = function () {
            if (!vm.repo)
                return;

            var index = vm.repositories.indexOf(vm.repo);
            if (index === -1)
                return;

            vm.repositories.splice(index, 1);

            // Set the selected to the first in the collection
            if (vm.repoCount())
                vm.setSelected(vm.repositories[0]);
            else
                vm.setSelected(null);

            vm.saveRepositories();
        };

        vm.hasPathWarnings = function() {
            return !_.isEmpty( vm.PathWarningsMsg );
        };

        /**
         *  Needs to stay in sync with dsExportGitWizard
         */
        vm.pathValidation = function() {
            vm.pathWarningsMsg = "";

            if ( !_.isEmpty( vm.gitCredentialsForm ) ) {
                delete vm.gitCredentialsForm.path.$error.invalidPath;
            }

            if ( !_.isEmpty( vm.repo.parameters[ 'file-path-property' ] ) ) {
                var error = false;

                // invalid path
                if ( vm.repo.parameters[ 'file-path-property' ].includes( "//" ) ||
                     vm.repo.parameters[ 'file-path-property' ].includes( "\\" ) ||
                     vm.repo.parameters[ 'file-path-property' ] == "/" ) {
                    error = true;
                }

                if ( error && !_.isEmpty( vm.gitCredentialsForm ) ) {
                    vm.gitCredentialsForm.path.$error.invalidPath = true;
                }

                if ( error ) return;

                // warnings
                if ( vm.repo.parameters[ 'file-path-property' ].endsWith( ".zip" ) ) {
                    vm.pathWarningsMsg = $translate.instant( 'gitCredentialsControl.folderNameZipMsg' );
                } else if ( vm.repo.parameters[ 'file-path-property' ].includes( "." ) ) {
                    vm.pathWarningsMsg = $translate.instant( 'gitCredentialsControl.folderNameDotMsg' );
                }
            }
        };

        /**
         * Generic handler function for alerting if the
         * FileReader failed to read a file for whatever
         * reason
         */
        function readerErrorAlert(event) {
            event = event || $window.event; // get window.event if e argument missing (in IE)

            var reason = '';
            switch (event.target.error.code) {
                case event.target.error.NOT_FOUND_ERR:
                    reason = $translate.instant('gitCredentialsControl.fileNotFoundMsg');
                    break;
                case event.target.error.NOT_READABLE_ERR:
                    reason = $translate.instant('gitCredentialsControl.fileNotReadableMsg');
                    break;
                case event.target.error.ABORT_ERR:
                    reason = $translate.instant('gitCredentialsControl.fileReadAbortedMsg');
                    break;
                case event.target.error.SECURITY_ERR:
                    reason = $translate.instant('gitCredentialsControl.fileLockedMsg');
                    break;
                default:
                    reason = $translate.instant('gitCredentialsControl.fileGenericeReadErrorMsg');
            }
            alert(reason);
        }

        /**
         * Fetch the file object from the given event, read the
         * file and store the content as base64 in the parameters
         * object under the attribute 'paramName'
         */
        function readerExtractContent(event, paramName) {
            var files = event.target.files;
            if (angular.isUndefined(files))
                return;

            if (files.length === 0)
                return;

            var myFile = files[0];
            var fName = myFile.name;

            //
            // Called through $apply to ensure it does not freeze the UI
            //
            $scope.$apply(function (scope) {
                // Check for the various File API support.
                if (! $window.File || ! $window.FileReader || ! $window.FileList || ! $window.Blob) {
                    alert($translate.instant('gitCredentialsControl.fileApisNotSupportedMsg', {fileName: fName}));
                    return;
                }

                //
                // Uses HTML5 FileReader for actually reading the file's contents
                //
                var reader = new FileReader();

                //
                // onLoad callback called when the file has been read
                // event.target is in fact the reader itself and 'result' is
                // populated on completion of the read.
                //
                reader.onload = function (event) {
                    var data = event.target.result;
                    vm.repo.parameters[paramName] = $base64.encode(data);
                };

                //
                // Error in case the reader failed
                //
                reader.onerror = readerErrorAlert;

                //
                // Read as a text string
                //
                reader.readAsText(myFile);
            });
        }

        /**
         * On receiving a change event from the file input, extract
         * the content of the hosts allow file and attach it to the parameters
         * object under the correct attribute
         */
        vm.onAllowHostsChange = function(event) {
            readerExtractContent(event, 'repo-known-hosts-property');
            vm.saveRepositories();
        };

        /**
         * On receiving a change event from the file input, extract
         * the content of the private key file and attach it to the parameters
         * object under the correct attribute
         */
        vm.onPrivateKeyChange = function(event) {
            readerExtractContent(event, 'repo-private-key-property');
            vm.saveRepositories();
        };

        /**
         * When the http/ssh password is set then encode the value
         * ready for transport
         */
        $scope.$watch('vm.clearPassword', function(value) {
            if (angular.isUndefined(vm.repo))
                return;

            if (angular.isUndefined(value) || value.length === 0) {
                delete vm.repo.parameters['repo-password-property'];
                vm.saveRepositories();
                return;
            }

            vm.repo.parameters['repo-password-property'] = $base64.encode(value);
            vm.saveRepositories();
        });

        /**
         * When the ssh passphrase is set then encode the value
         * ready for transport
         */
        $scope.$watch('vm.clearPassphrase', function(value) {
            if (angular.isUndefined(vm.repo))
                return;

            if (angular.isUndefined(value) || value.length === 0) {
                delete vm.repo.parameters['repo-passphrase-property'];
                vm.saveRepositories();
                return;
            }

            vm.repo.parameters['repo-passphrase-property'] = $base64.encode(value);
            vm.saveRepositories();
        });

        initRepositories();
        vm.pathValidation(); // initialize path validation warnings
    }
})();
