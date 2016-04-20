(function () {
    'use strict';

    var pluginName = 'vdb-bench.widgets';
    var pluginDirName = 'vdb-bench-widgets';

    angular
        .module(pluginName)
        .directive('vdbList', VdbList);

    VdbList.$inject = ['CONFIG', 'SYNTAX'];
    VdbListController.$inject = ['VdbSelectionService', 'RepoRestService'];

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

    function VdbListController(VdbSelectionService, RepoRestService) {
        var vm = this;

        vm.vdbs = [];

        vm.accOpen = vm.open;
        if (angular.isUndefined(vm.accOpen))
            vm.accOpen = false;

        /**
         * Fetch the list of vdbs from the selected repository
         */
        function initVdbs() {
            try {
                var type = vm.vdbType;
                if (angular.isUndefined(vm.vdbType))
                    type = 'workspace';

                RepoRestService.getVdbs(type).then(
                    function (newVdbs) {
                        RepoRestService.copy(newVdbs, vm.vdbs);
                    },
                    function (response) {
                        // Some kind of error has occurred
                        vm.vdbs = [];
                        throw RepoRestService.newRestException("Failed to load vdbs from the host services.\n" + response.message);
                    });
            } catch (error) {
                vm.vdbs = [];
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
                        throw new vdbBench.RestServiceException("Failed to remove the vdb " + selected.id + "from the host services.\n" + response.message);
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
