(function () {
    'use strict';

    var pluginName = 'vdb-bench.dataservice';
    var pluginDirName = 'vdb-bench-dataservice';

    angular
        .module(pluginName)
        .controller('DSPrefController', DSPrefController);

    DSPrefController.$inject = ['$scope', 'preferencesRegistry'];

    function DSPrefController($scope, preferencesRegistry) {
        var vm = this;
        var panels = preferencesRegistry.getTabs();

        vm.names = sortNames(_.keys(panels));

        $scope.$watch(function () {
            panels = preferencesRegistry.getTabs();
            vm.names = sortNames(_.keys(panels));
            Core.$apply($scope);
        });

        vm.exitPreferences = function() {
            $scope.vmmain.selectPage($scope.vmmain.previousPageId());
        };

        vm.setPanel = function (name) {
            vm.pref = name;
        };

        vm.hasPanel = function() {
            return ! _.isEmpty(vm.pref);
        };

        vm.active = function (name) {
            if (name === vm.pref) {
                return 'active';
            }
            return '';
        };

        vm.getPrefs = function (pref) {
            var panel = panels[pref];
            if (panel) {
                return panel.template;
            }
            return undefined;
        };

        /**
         * Sort the preference by names (and ensure Reset is last).
         * @param names  the names
         * @returns {any} the sorted names
         */
        function sortNames(names) {
            return names.sort(function (a, b) {
                return a.localeCompare(b);
            });
        }

        //
        // Select the first tab in the list-style
        //
        if (! _.isEmpty(vm.names)) {
            vm.setPanel(vm.names[0]);
        }
    }

})();
