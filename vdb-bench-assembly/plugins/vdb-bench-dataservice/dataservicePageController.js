(function () {
    'use strict';

    var pluginName = 'vdb-bench.dataservice';
    var pluginDirName = 'vdb-bench-dataservice';

    angular
        .module(pluginName)
        .controller('DataServicePageController', DataServicePageController);

    DataServicePageController.$inject = ['$scope', 'SYNTAX', 'CONFIG', 'RepoRestService', 'DSSelectionService'];

    function DataServicePageController($scope, syntax, config, RepoRestService, DSSelectionService) {
        var vm = this;

        /*
         * When a data service is currently being deployed
         */
        $scope.$on('dataServicePageChanged', function (event, pageId) {
            vm.selectPage(pageId);
        });
        
        var DATASERVICE_SUMMARY_PAGE = 'dataservice-summary';
        var NEW_DATASERVICE_PAGE = 'dataservice-new';
        var IMPORT_DATASERVICE_PAGE = 'dataservice-import';
        var EDIT_DATASERVICE_PAGE = 'dataservice-edit';
        var CLONE_DATASERVICE_PAGE = 'dataservice-clone';
        var TEST_DATASERVICE_PAGE = 'dataservice-test';
        var CONNECTION_SUMMARY_PAGE = 'connection-summary';
        var DATASOURCE_SUMMARY_PAGE = 'datasource-summary';
        
        var pages = {
            'dataservice-summary': {
                id: 'dataservice-summary',
                title: 'Data Services',
                template: config.pluginDir + syntax.FORWARD_SLASH +
                                    pluginDirName + syntax.FORWARD_SLASH +
                                    'dataservice-summary.html'
            },
            'dataservice-new': {
                id: 'dataservice-new',
                title: 'New Data Service',
                template: config.pluginDir + syntax.FORWARD_SLASH +
                                    pluginDirName + syntax.FORWARD_SLASH +
                                    'dataservice-new.html'
            },
            'dataservice-import': {
                id: 'dataservice-import',
                title: 'Import Data Service',
                template: config.pluginDir + syntax.FORWARD_SLASH +
                                    pluginDirName + syntax.FORWARD_SLASH +
                                    'dataservice-import.html'
            },
            'dataservice-edit': {
                id: 'dataservice-edit',
                title: 'Edit Data Service',
                template: config.pluginDir + syntax.FORWARD_SLASH +
                                    pluginDirName + syntax.FORWARD_SLASH +
                                    'dataservice-edit.html'
            },
            'dataservice-clone': {
                id: 'dataservice-clone',
                title: 'Clone Data Service',
                template: config.pluginDir + syntax.FORWARD_SLASH +
                                    pluginDirName + syntax.FORWARD_SLASH +
                                    'dataservice-clone.html'
            },
            'dataservice-test': {
                id: 'dataservice-test',
                title: 'Test Data Service',
                template: config.pluginDir + syntax.FORWARD_SLASH +
                                    pluginDirName + syntax.FORWARD_SLASH +
                                    'dataservice-test.html'
            },
            'connection-summary': {
                id: 'connection-summary',
                title: 'Connection Summary',
                template: config.pluginDir + syntax.FORWARD_SLASH +
                                    pluginDirName + syntax.FORWARD_SLASH +
                                    'connections/connection-summary.html'
            },
            'datasource-summary': {
                id: 'datasource-summary',
                title: 'Datasource Summary',
                template: config.pluginDir + syntax.FORWARD_SLASH +
                                    pluginDirName + syntax.FORWARD_SLASH +
                                    'datasources/datasource-summary.html'
            }
        };

        vm.selectPage = function(pageId) {
            vm.selectedPage = pages[pageId];
        };

        /*
         * Service : get selected data service
         */
        vm.selectedDataservice = function () {
            return DSSelectionService.selectedDataService();
        };
        
        vm.selectPage(DATASERVICE_SUMMARY_PAGE);
    }

})();
