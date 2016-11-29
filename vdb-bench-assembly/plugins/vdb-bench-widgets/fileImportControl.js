(function () {
    'use strict';

    var pluginName = 'vdb-bench.widgets';
    var pluginDirName = 'vdb-bench-widgets';

    angular
        .module(pluginName)
        .directive('fileImportControl', FileImportControl);

    FileImportControl.$inject = ['CONFIG', 'SYNTAX'];
    FileImportController.$inject = ['$scope', 'SYNTAX', 'RepoRestService', '$window'];

    function FileImportControl(config, syntax) {
        var directive = {
            restrict: 'E',
            replace: true, // Replaces the <file-import-button> tag with the template
            scope: {},
            bindToController: {
                'onImportComplete': '&',
                'showCancel': '=',
                'onCancel': '&'
            },
            controller: FileImportController,
            controllerAs: 'vm',
            templateUrl: config.pluginDir + syntax.FORWARD_SLASH +
                pluginDirName + syntax.FORWARD_SLASH +
                'fileImportControl.html'
        };

        return directive;
    }

    function FileImportController($scope, SYNTAX, RepoRestService, $window) {
        var vm = this;

        function setError(message) {
            if (message) {
                message = message.replace(/<br\/>/g, SYNTAX.NEWLINE);
            }

            vm.error = message;
        }

        function setResponse(response) {
            if (response) {
                vm.response = "OK";
                vm.responseStyleClass = "import-control-response-ok";
            }
            else {
                vm.response = "Failed";
                vm.responseStyleClass = "import-control-response-bad";
            }
        }

        vm.showProgress = function(display) {
            vm.inProgress = display;
        };

        vm.showProgress(false);

        vm.displayCancel = function() {
            if (angular.isUndefined(vm.showCancel))
                return true;

            return vm.showCancel;
        };

        /**
         * Function for calling the appropriate callback if the cancel button
         * has been clicked.
         */
        vm.cancel = function(fileInputElement) {
            if (angular.isUndefined(vm.onCancel))
                return;

            vm.onCancel();
        };

        /**
         * Function for conducting a file import called from on-change event
         * in browse button. The calling html input element is passed in.
         */
        vm.importFile = function (event) {
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
                    setError($translate.instant('fileImportControl.fileApisNotSupportedMsg'));
                    return;
                }

                var myFile = files[0];
                var fName = myFile.name;
                var documentType = RepoRestService.documentType(fName);
                if (documentType === null) {
                    setError($translate.instant('fileImportControl.invalidFileTypeMsg' , {fileName: fName}));
                    return;
                }

                //
                // Display the progress bar and hide the browse button
                //
                vm.showProgress(true);

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
                    var parameters = {};
                    if(documentType === 'jar') {
                        parameters = {'driverName':fName};
                    }
                    //
                    // Attempt to upload the file to the workspace
                    //
                    RepoRestService.upload(documentType, "", parameters, data).then(
                        function (importStatus) {
                            vm.showProgress(false);
                            setError(null);
                            setResponse(importStatus.success ? true: false);
                            vm.onImportComplete({result: importStatus});
                        },
                        function (response) {
                            vm.showProgress(false);
                            setError(RepoRestService.responseMessage(response));
                            setResponse(false);
                            vm.onImportComplete({result: response});
                        });
                };

                //
                // Error in case the reader failed
                //
                reader.onerror = function (event) {
                    event = event || $window.event; // get window.event if e argument missing (in IE)

                    var reason = '';
                    switch (event.target.error.code) {
                        case event.target.error.NOT_FOUND_ERR:
                            reason = $translate.instant('fileImportControl.fileNotFoundMsg', {fileName: myFile.name});
                            break;
                        case event.target.error.NOT_READABLE_ERR:
                            reason = $translate.instant('fileImportControl.fileNotReadableMsg', {fileName: myFile.name});
                            break;
                        case event.target.error.ABORT_ERR:
                            reason = $translate.instant('fileImportControl.fileReadAbortedMsg', {fileName: myFile.name});
                            break;
                        case event.target.error.SECURITY_ERR:
                            reason = $translate.instant('fileImportControl.fileLockedMsg', {fileName: myFile.name});
                            break;
                        default:
                            reason = $translate.instant('fileImportControl.fileReadErrorMsg', {fileName: myFile.name});
                    }
                    setError(reason);
                    setResponse(false);
                    vm.inProgress = false;
                };

                //
                // Read as a binary string to allow for zip files
                //
                try {
                    reader.readAsBinaryString(myFile);
                } catch (exception) {
                	var msg = $translate.instant('fileImportControl.binaryReadErrorMsg', 
                			                     {fileName: myFile.name, errorMsg: exception.message});
                    setError(msg);
                    setResponse(false);
                    vm.inProgress = false;
                }
            });
        };
    }
})();
