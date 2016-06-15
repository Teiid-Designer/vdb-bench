(function () {
    'use strict';

    var pluginName = 'vdb-bench.dataservice';
    var pluginDirName = 'vdb-bench-dataservice';

    angular
        .module(pluginName)
        .controller('DataServicePageController', DataServicePageController);

    DataServicePageController.$inject = ['SYNTAX', 'CONFIG'];

    function DataServicePageController(syntax, config) {
        var vm = this;

        vm.dataservice = null;
        
        var DATASERVICE_SUMMARY_PAGE = 'dataservice-summary';
        var NEW_DATASERVICE_PAGE = 'dataservice-new';
        var IMPORT_DATASERVICE_PAGE = 'dataservice-import';
        var EDIT_DATASERVICE_PAGE = 'dataservice-edit';
        var CLONE_DATASERVICE_PAGE = 'dataservice-clone';
        var TEST_DATASERVICE_PAGE = 'dataservice-test';
        var PATTERNFLY_TOOLBAR_PAGE = 'pftoolbar';
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
            'pftoolbar': {
                id: 'pftoolbar',
                title: 'Patternfly toolbar',
                template: config.pluginDir + syntax.FORWARD_SLASH +
                                    pluginDirName + syntax.FORWARD_SLASH +
                                    'pftoolbar.html'
            }
        };

        vm.selectPage = function(pageId, dataservice) {
            vm.selectedPage = pages[pageId];
            vm.dataservice = dataservice;
        };

        /*
         * Service : get selected vdb
         */
        vm.selectedDataservice = function () {
            return vm.dataservice;
        };
        
        vm.selectPage(DATASERVICE_SUMMARY_PAGE, null);

    }

})();
