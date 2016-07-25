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
        var EXPORT_DATASERVICE_PAGE = 'dataservice-export';

        var pages = {};
        pages[DATASERVICE_SUMMARY_PAGE] = {
            id: DATASERVICE_SUMMARY_PAGE,
            title: 'Data Services',
            template: config.pluginDir + syntax.FORWARD_SLASH +
                            pluginDirName + syntax.FORWARD_SLASH +
                            DATASERVICE_SUMMARY_PAGE + syntax.DOT + syntax.HTML
        };
        pages[NEW_DATASERVICE_PAGE] = {
            id: NEW_DATASERVICE_PAGE,
            title: 'New Data Service',
            template: config.pluginDir + syntax.FORWARD_SLASH +
                    pluginDirName + syntax.FORWARD_SLASH +
                    NEW_DATASERVICE_PAGE + syntax.DOT + syntax.HTML
        };
        pages[IMPORT_DATASERVICE_PAGE] = {
            id: IMPORT_DATASERVICE_PAGE,
            title: 'Import Data Service',
            template: config.pluginDir + syntax.FORWARD_SLASH +
                            pluginDirName + syntax.FORWARD_SLASH +
                            IMPORT_DATASERVICE_PAGE + syntax.DOT + syntax.HTML
        };
        pages[EXPORT_DATASERVICE_PAGE] = {
            id: EXPORT_DATASERVICE_PAGE,
            title: 'Export Data Service',
            template: config.pluginDir + syntax.FORWARD_SLASH +
                            pluginDirName + syntax.FORWARD_SLASH +
                            EXPORT_DATASERVICE_PAGE + syntax.DOT + syntax.HTML
        };
        pages[EDIT_DATASERVICE_PAGE] = {
            id: EDIT_DATASERVICE_PAGE,
            title: 'Edit Data Service',
            template: config.pluginDir + syntax.FORWARD_SLASH +
                            pluginDirName + syntax.FORWARD_SLASH +
                            EDIT_DATASERVICE_PAGE + syntax.DOT + syntax.HTML
        };
        pages[CLONE_DATASERVICE_PAGE] = {
            id: CLONE_DATASERVICE_PAGE,
            title: 'Clone Data Service',
            template: config.pluginDir + syntax.FORWARD_SLASH +
                            pluginDirName + syntax.FORWARD_SLASH +
                            CLONE_DATASERVICE_PAGE + syntax.DOT + syntax.HTML
        };
        pages[TEST_DATASERVICE_PAGE] = {
            id: TEST_DATASERVICE_PAGE,
            title: 'Test Data Service',
            template: config.pluginDir + syntax.FORWARD_SLASH +
                            pluginDirName + syntax.FORWARD_SLASH +
                            TEST_DATASERVICE_PAGE + syntax.DOT + syntax.HTML
        };
        pages[CONNECTION_SUMMARY_PAGE] = {
            id: CONNECTION_SUMMARY_PAGE,
            title: 'Connection Summary',
            template: config.pluginDir + syntax.FORWARD_SLASH +
                            pluginDirName + syntax.FORWARD_SLASH +
                            'connections' + syntax.FORWARD_SLASH + CONNECTION_SUMMARY_PAGE + syntax.DOT + syntax.HTML
        };
        pages[DATASOURCE_SUMMARY_PAGE] = {
            id: DATASOURCE_SUMMARY_PAGE,
            title: 'Datasource Summary',
            template: config.pluginDir + syntax.FORWARD_SLASH +
                            pluginDirName + syntax.FORWARD_SLASH +
                            'datasources' + syntax.FORWARD_SLASH + DATASOURCE_SUMMARY_PAGE + syntax.DOT + syntax.HTML
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
