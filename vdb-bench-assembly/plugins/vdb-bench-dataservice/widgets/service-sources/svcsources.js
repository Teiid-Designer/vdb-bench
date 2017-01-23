(function () {
    'use strict';

    var pluginDirName = 'vdb-bench-dataservice/widgets/service-sources';

    angular.module('adf.widget.ds-svcsources', [
        'ui.bootstrap',
        'angularUtils.directives.dirPagination',
        'adf.provider',
        'vdb-bench.core'
    ])
        .config(config)
        .controller('DSSvcSourcesController', DSSvcSourcesController);

    config.$inject = ['dashboardProvider', 'CONFIG', 'SYNTAX'];

    function config(dashboardProvider, config, syntax) {
        dashboardProvider
            .widget('ds-svcsources', {
                title: 'Data Sources',
                description: 'Displays the current Data Sources',
                templateUrl: config.pluginDir + syntax.FORWARD_SLASH +
                                    pluginDirName + syntax.FORWARD_SLASH +
                                    'svcsources.html',
                controller: 'DSSvcSourcesController',
                controllerAs: 'vm'
            });
    }

    DSSvcSourcesController.$inject = ['SvcSourceSelectionService', '$scope', '$rootScope', 'DSPageService'];

    function DSSvcSourcesController(SvcSourceSelectionService, $scope, $rootScope, DSPageService) {
        var vm = this;

        vm.loading = true;
        vm.total = {};
        vm.names = [];

        function setTotal(total) {
            vm.total = total;
        }

        function setNames(sources) {
            if (_.isEmpty(sources))
                vm.names = [];

            var names = [];
            for (var i = 0; i < sources.length; ++i) {
                names.push(sources[i].keng__id);
            }

            vm.names = names;
        }

        function setError(error) {
            vm.error = error;
        }

        vm.selectPage = function(pageId) {
            //
            // Should notify the dataPageController to change the page view
            //
            $rootScope.$broadcast("dataServicePageChanged", pageId);
        };

        vm.page = function(pageId) {
            return DSPageService.page(pageId);
        };

        vm.init = function() {
            if (SvcSourceSelectionService.isLoading())
                return;

            var sources = SvcSourceSelectionService.getServiceSources();
            setError(null);
            setTotal(sources.length);
            setNames(sources);
            vm.loading = false;
        };

        $scope.$on('loadingServiceSourcesChanged', function(event, loadingState) {
            if (loadingState !== false)
                return;

            vm.init();
        });

        vm.init();
    }
    
})();
