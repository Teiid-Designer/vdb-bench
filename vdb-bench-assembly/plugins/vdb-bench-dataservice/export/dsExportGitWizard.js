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
                'git-wizard.html'
        };

        return directive;
    }

    function DSExportGitWizardController($window, $scope, $base64, syntax, DSSelectionService, RepoRestService) {
        var vm = this;

        /**
         * Final location of all the parameters
         * populated by the wizard
         */
        vm.parameters = {};

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
         * Generic handler function for alerting if the
         * FileReader failed to read a file for whatever
         * reason
         */
        function readerErrorAlert(event) {
            event = event || $window.event; // get window.event if e argument missing (in IE)

            var reason = '';
            switch (event.target.error.code) {
                case event.target.error.NOT_FOUND_ERR:
                    reason = "cannot be found";
                    break;
                case event.target.error.NOT_READABLE_ERR:
                    reason = "is not readable";
                    break;
                case event.target.error.ABORT_ERR:
                    reason = "Read operation was aborted";
                    break;
                case event.target.error.SECURITY_ERR:
                    reason = "File is in a locked state";
                    break;
                default:
                    reason = "Read error";
            }
            alert('The file "' + myFile.name + '" ' + reason);
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

            //
            // Called through $apply to ensure it does not freeze the UI
            //
            $scope.$apply(function (scope) {
                // Check for the various File API support.
                if (! $window.File || ! $window.FileReader || ! $window.FileList || ! $window.Blob) {
                    alert('The File APIs are not fully supported in this browser. Cannot proceed with import.');
                    return;
                }

                var myFile = files[0];
                var fName = myFile.name;

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
                    vm.parameters[paramName] = $base64.encode(data);
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
        };

        /**
         * On receiving a change event from the file input, extract
         * the content of the private key file and attach it to the parameters
         * object under the correct attribute
         */
        vm.onPrivateKeyChange = function(event) {
            readerExtractContent(event, 'repo-private-key-property');
        };

        /**
         * When the http password is set then encode the value
         * ready for transport
         */
        $scope.$watch('vm.httpClearPassword', function(value) {
            if (angular.isUndefined(value) || value.length === 0) {
                delete vm.parameters['repo-password-property'];
                return;
            }

            vm.parameters['repo-password-property'] = $base64.encode(value);
        });

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
                RepoRestService.export('git', vm.parameters, dataservice).then(
                    function (exportStatus) {
                        vm.showProgress(false);
                        setError(null);
                        setResponse(exportStatus.success ? 'OK': 'Failed');
                    },
                    function (response) {
                        // Some kind of error has occurred
                        vm.showProgress(false);
                        setResponse('Failed');
                        if (response.message)
                            setError(response.message);
                        else if (response.data && response.data.error)
                            setError(response.data.error);
                        else if (response.status && response.statusText)
                            setError(response.status + syntax.COLON + response.statusText);
                        else
                            setError("Unknown Error");
                    });
            } catch (error) {
                vm.showProgress(false);
                setResponse('Failed');
                setError(error.message);
            }
        };
    }
})();
