(function () {
    'use strict';

    var pluginName = 'vdb-bench.widgets';
    var pluginDirName = 'vdb-bench-widgets';

    angular
        .module(pluginName)
        .directive('vdbList', VdbList);

    VdbList.$inject = ['CONFIG', 'SYNTAX'];
    VdbListController.$inject = ['VdbSelectionService', 'RepoRestService',
                                                'REST_URI', 'SYNTAX', 'VDB_KEYS',
                                                'FileSaver', 'Blob', '$window', '$scope'];

    function VdbList(config, syntax) {
        var directive = {
            restrict: 'E',
            scope: {},
            bindToController: {
                open: '=',
                vdbType: '@',
                showButtons: '=',
            },
            controller: VdbListController,
            controllerAs: 'vm',
            templateUrl: config.pluginDir + syntax.FORWARD_SLASH +
                pluginDirName + syntax.FORWARD_SLASH +
                'vdbList.html'
        };

        return directive;
    }

    function VdbListController(VdbSelectionService, RepoRestService,
                                            REST_URI, SYNTAX, VDB_KEYS,
                                            FileSaver, Blob, $window, $scope) {
        var vm = this;

        vm.vdbs = [];
        vm.init = false;
        vm.showImport = false;

        vm.accOpen = vm.open;
        if (angular.isUndefined(vm.accOpen))
            vm.accOpen = false;

        /**
         * Fetch the list of vdbs from the selected repository
         */
        function initVdbs() {
            vm.init = true;

            try {
                var type = vm.vdbType;
                if (angular.isUndefined(vm.vdbType))
                    type = REST_URI.WKSP_SERVICE;

                RepoRestService.getVdbs(type).then(
                    function (newVdbs) {
                        RepoRestService.copy(newVdbs, vm.vdbs);
                        vm.init = false;
                    },
                    function (response) {
                        // Some kind of error has occurred
                        vm.vdbs = [];
                        vm.init = false;
                        throw RepoRestService.newRestException("Failed to load vdbs from the host services.\n" + response.message);
                    });
            } catch (error) {
                vm.vdbs = [];
                vm.init = false;
                alert("An exception occurred:\n" + error.message);
            }

            // Removes any outdated vdb
            VdbSelectionService.setSelected(null);
        }

        vm.hasButtons = function() {
            if (angular.isUndefined(vm.showButtons))
                return true;

            return vm.showButtons;
        };

        /*
         * Select the given vdb
         */
        vm.selectVdb = function (vdb) {
            //
            // Set the selected vdb
            //
            VdbSelectionService.setSelected(vdb);
        };

        /*
         * return selected vdb
         */
        vm.vdbSelected = function () {
            return VdbSelectionService.selected();
        };

        /**
         * Event handler for clicking the add button
         */
        vm.onAddClicked = function (event) {
            try {
                $window.alert("To be implemented");
            } catch (error) {

            } finally {
                // Essential to stop the accordion closing
                event.stopPropagation();
            }
        };

        /**
         * Event handler for clicking the remove button
         */
        vm.onRemoveClicked = function (event) {
            var selected = VdbSelectionService.selected();
            try {
                RepoRestService.removeVdb(selected).then(
                    function () {
                        // Reinitialise the list of vdbs
                        initVdbs();
                    },
                    function (response) {
                        throw new RepoRestService.newRestException("Failed to remove the vdb " + selected[VDB_KEYS.ID] + "from the host services.\n" + response.message);
                    });
            } catch (error) {} finally {
                // Essential to stop the accordion closing
                event.stopPropagation();
            }
        };

        /**
         * Event handler for importing a vdb
         */
        vm.onImportClicked = function(event) {
            try {
                // Check for the various File API support.
                if (! $window.File || ! $window.FileReader || ! $window.FileList || ! $window.Blob) {
                    alert('The File APIs are not fully supported in this browser. Cannot proceed with import.');
                    return;
                }

                vm.showImport = true;
            } finally {
                // Essential to stop the accordion closing
                event.stopPropagation();
            }
        };

        /**
         * Function for conducting a file import called from on-change event
         * in browse button. The calling html input element is passed in.
         */
        vm.importFile = function(fileInputElement) {
            //
            // Called through $apply to ensure it does not freeze the UI
            //
            $scope.$apply(function(scope) {
                var myFile = fileInputElement.files[0];
                var fName = myFile.name;

                //
                // Valid formats currently implemented
                //
                var validFormats = ['ZIP', 'XML', 'DDL'];
                var documentType = myFile.name.substring(myFile.name.lastIndexOf(SYNTAX.DOT) + 1).toUpperCase();

                if (validFormats.indexOf(documentType) === -1) {
                    alert(fName + "'s file type (" + documentType + ") is not valid hence the file cannot be imported.");
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
                reader.onload = function(event) {
                    var data = event.target.result;

                    // Hide the import dialog
                    vm.showImport = false;

                    // Show the progress bar
                    vm.init = true;

                    //
                    // Attempt to upload the file to the workspace
                    //
                    RepoRestService.upload(documentType, data).then(
                        function (importStatus) {
                            // Reinitialise the list of vdbs
                            initVdbs();
                        },
                        function (response) {
                            alert("Failed to import the file to the host.\n" + response.data.error);

                            // Reinitialise the list of vdbs
                            initVdbs();
                        });
                };

                //
                // Error in case the reader failed
                //
                reader.onerror = function(event) {
                    event = event || $window.event; // get window.event if e argument missing (in IE)

                    var reason = '';
                    switch(event.target.error.code) {
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
                };

                //
                // Read as a binary string to allow for zip files
                //
                reader.readAsBinaryString(myFile);
            });
        };

        /**
         * Event handler for exporting the vdb
         */
        vm.onExportClicked = function(event) {
            var selected = VdbSelectionService.selected();
            try {
                RepoRestService.download(selected).then(
                    function (exportStatus) {
                        if (! exportStatus.downloadable)
                            return;

                        if (! exportStatus.content)
                            return;

                        var enc = exportStatus.content;
                        var content = atob(enc);
                        var data = new Blob([content], { type: 'text/plain;charset=utf-8' });

                        var name = exportStatus.name;
                        if (_.isEmpty(name))
                            name = 'export';

                        var type = exportStatus.type;
                        if (_.isEmpty(type))
                            type = 'txt';

                        FileSaver.saveAs(data, name + SYNTAX.DOT + type);
                    },
                    function (response) {
                        throw new RepoRestService.newRestException("Failed to export the artifact " + selected[VDB_KEYS.ID] + " from the host services.\n" + response.data.error);
                    });
            } catch (error) {} finally {
                // Essential to stop the accordion closing
                event.stopPropagation();
            }
        };

        // Initialise vdb collection on loading
        initVdbs();
    }
})();
