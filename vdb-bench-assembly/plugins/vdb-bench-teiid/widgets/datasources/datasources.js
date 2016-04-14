(function () {
    'use strict';

    var pluginDirName = 'vdb-bench-teiid/widgets/datasources';

    angular.module('adf.widget.teiid-data-sources', [
        'ui.bootstrap',
        'angularUtils.directives.dirPagination',
        'adf.provider',
        'vdb-bench.core'
    ])
        .config(config)
        .controller('TeiidDataSrcController', TeiidDataSrcController);

    config.$inject = ['dashboardProvider', 'CONFIG', 'SYNTAX'];

    function config(dashboardProvider, config, syntax) {
        dashboardProvider
            .widget('teiid-data-sources', {
                title: 'Data Sources',
                description: 'Displays the current data sources of the local Teiid Instance',
                templateUrl: config.pluginDir + syntax.FORWARD_SLASH +
                                    pluginDirName + syntax.FORWARD_SLASH +
                                    'datasrc.html',
                controller: 'TeiidDataSrcController',
                controllerAs: 'vm'
            });
    }

    TeiidDataSrcController.$inject = ['RepoRestService', '$scope'];

    function TeiidDataSrcController(RepoRestService, $scope) {
        var vm = this;

        vm.loading = true;
        vm.total = {};
        vm.names = [];

        function setTotal(total) {
            vm.total = total;
        }

        function setNames(names) {
            if (names)
                vm.names = names;
            else
                vm.names = [];
        }

        function setError(error) {
            vm.error = error;
        }

        vm.init = function(){
            try {
                RepoRestService.getTeiidStatus().then(
                    function (teiidStatus) {
                        setError(null);
                        setTotal(teiidStatus.dataSourceSize);
                        setNames(teiidStatus.dataSourceNames);
                        vm.loading = false;
                    },
                    function (response) {
                        // Some kind of error has occurred
                        setTotal(0);
                        setNames(null);

                        setError(response.message);
                        vm.loading = false;
                    });
            } catch (error) {
                setTotal(0);
                setNames(null);

                setError(error.message);
                vm.loading = false;
            }
        };

        vm.init();
    }
    
})();
