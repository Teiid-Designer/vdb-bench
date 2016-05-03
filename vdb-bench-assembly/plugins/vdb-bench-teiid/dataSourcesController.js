(function () {
    'use strict';

    var pluginName = 'vdb-bench.teiid';
    var pluginDirName = 'vdb-bench-teiid';

    angular
        .module(pluginName)
        .controller('DataSourcesController', DataSourcesController);

    DataSourcesController.$inject = ['RepoRestService', 'REST_URI'];

    function DataSourcesController(RepoRestService, REST_URI) {
        var vm = this;

        vm.datasources = [];
        vm.datasource = null;
        vm.init = false;

        /**
         * Fetch the list of datasources from the selected repository
         */
        function initDataSources() {
            vm.init = true;

            try {
                var type = REST_URI.TEIID_SERVICE;

                RepoRestService.getDataSources(type).then(
                    function (newDataSources) {
                        RepoRestService.copy(newDataSources, vm.datasources);
                        vm.init = false;
                    },
                    function (response) {
                        // Some kind of error has occurred
                        vm.datasources = [];
                        vm.init = false;
                        throw RepoRestService.newRestException("Failed to load data sources from the host services.\n" + response.message);
                    });
            } catch (error) {
                vm.datasources = [];
                vm.init = false;
                alert("An exception occurred:\n" + error.message);
            }

            // Removes any outdated datasource
            vm.datasource = null;
        }

        /*
         * Select the given datasources
         */
        vm.selectDataSource = function (datasource) {
            //
            // Set the selected datasource
            //
            vm.datasource = datasource;
        };

        /*
         * return selected datasource
         */
        vm.datasourceSelected = function () {
            return vm.datasource;
        };

        /*
         * return selected datasource
         */
        vm.hasSelectedDataSource = function () {
            if (! angular.isDefined(vm.datasource))
                return false;

            if (_.isEmpty(vm.datasource))
                return false;

            if (vm.datasource === null)
                return false;

            return true;
        };

        // Initialise datasource collection on loading
        initDataSources();
    }
})();
