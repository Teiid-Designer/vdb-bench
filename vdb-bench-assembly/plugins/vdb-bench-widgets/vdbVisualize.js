(function () {
    'use strict';

    var pluginName = 'vdb-bench.widgets';
    var pluginDirName = 'vdb-bench-widgets';

    angular
        .module(pluginName)
        .directive('vdbVisualize', VdbVisualize);

    VdbVisualize.$inject = ['CONFIG', 'SYNTAX'];
    VdbVisualizeController.$inject = ['VdbSelectionService', '$scope'];

    function VdbVisualize(config, syntax) {
        var directive = {
            restrict: 'E',
            scope: {},
            bindToController: {
                open: '=',
                vdbType: '@',
                showButtons: '=',
            },
            controller: VdbVisualizeController,
            controllerAs: 'vm',
            templateUrl: config.pluginDir + syntax.FORWARD_SLASH +
                pluginDirName + syntax.FORWARD_SLASH +
                'vdbVisualize.html'
        };

        return directive;
    }

    function VdbVisualizeController(VdbSelectionService, $scope) {
        var vm = this;

        var DIAGRAM_TAB_ID = "Diagram";
        var PREVIEW_TAB_ID = "Preview";

        vm.previewRefresh = false;
        vm.visibleTabId = DIAGRAM_TAB_ID;

        /**
         * Options for the codemirror editor used for previewing vdb xml
         */
        vm.xmlPreviewOptions = {
            lineWrapping: true,
            lineNumbers: true,
            readOnly: 'nocursor',
            mode: 'xml'
        };

        /*
         * return selected vdb
         */
        vm.vdbSelected = function () {
            return VdbSelectionService.selected();
        };

        /*
         * Update the contents of the visible tab
         */
        function tabUpdate() {
            //
            // Only update preview tab if it is currently visible
            // Setting the value of the codemirror editor before its visible
            // causes it to not display when its tab is clicked on (requires an extra click)
            //
            // However, need to update the tab if it is displayed
            //
            if (vm.visibleTabId == PREVIEW_TAB_ID) {
                VdbSelectionService.selectedXml();
                vm.previewRefresh = !vm.previewRefresh;
            }
        }

        /**
         * When the preview tab is selected, fetch the selected vdb xml
         * and display it in the code mirror editor
         */
        vm.onTabSelected = function (tabId) {
            // Stash the tab id for use with updating the preview tab
            vm.visibleTabId = tabId;

            tabUpdate();
        };

        /*
         * When the vdb selection changes
         */
        $scope.$on('selectedVdbChanged', function (event, newVdb) {
            tabUpdate();
        });

        vm.selectedVdbComponent = [];

        /*
         * is their a vdb component selection
         */
        vm.vdbComponentSelected = function() {
            return ! _.isEmpty(vm.selectedVdbComponent);
        };
    }
})();
