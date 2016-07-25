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

        vm.showProgress = function(display) {
            vm.inProgress = display;
        };

        vm.showProgress(false);

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
                    alert('The File APIs are not fully supported in this browser. Cannot proceed with import.');
                    return;
                }

                var myFile = files[0];
                var fName = myFile.name;

                //
                // Valid formats currently implemented
                //
                var validFormats = ['zip', '-vdb.xml', 'tds', 'ddl'];
                var documentType = null;
                validFormats.forEach( function(format) {
                    if (fName.endsWith(format)) {
                        documentType = format;
                    }
                });

                if (documentType === null) {
                    alert(fName + "'s file type is not valid hence the file cannot be imported.");
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

                    //
                    // Attempt to upload the file to the workspace
                    //
                    RepoRestService.upload(documentType, data).then(
                        function (importStatus) {
                            vm.showProgress(false);
                            vm.onImportComplete({result: importStatus});
                        },
                        function (response) {
                            alert("Failed to import the file to the host.\n" + response.data.error);
                            vm.showProgress(false);
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
                    vm.inProgress = false;
                };

                //
                // Read as a binary string to allow for zip files
                //
                reader.readAsBinaryString(myFile);
            });
        };
    }
})();
