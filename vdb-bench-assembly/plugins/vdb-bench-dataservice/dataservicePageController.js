(function () {
    'use strict';

    var pluginName = 'vdb-bench.dataservice';
    var pluginDirName = 'vdb-bench-dataservice';

    angular
        .module(pluginName)
        .directive('bodyClick', BodyClickDirective)
        .controller('DataServicePageController', DataServicePageController);

    BodyClickDirective.$inject = ['$parse', '$document'];
    DataServicePageController.$inject = ['$scope', 'SYNTAX', 'CONFIG', 'RepoRestService', 'DSSelectionService', 'ConnectionSelectionService', 'SvcSourceSelectionService'];

    /**
     * Designed to bind a click handler to body element which,
     * when a click occurs, will execute the attribute provided
     * to the directive, eg. to cancel the display of a popup.
     */
    function BodyClickDirective($parse, $document) {
        var directive = {
            compile: function($element, attr) {
                // Parse the expression to be executed
                // whenever someone clicks _off_ this element.
                var delegateFn = $parse(attr.bodyClick);

                return function(scope, element, attr) {
                    //
                    // Adds a click handler to the element that
                    // stops the event propagation.
                    //
                    element.bind("click", function(event) {
                        event.stopPropagation();
                    });

                    //
                    // Function to be executed that delegates
                    // to the parsed functional attribute
                    //
                    var bodyClickFunction = function(event) {
                        scope.$apply(function() {
                            delegateFn(scope, {$event:event});
                        });
                    };

                    angular
                        .element($document[0].body)
                        .bind("click", bodyClickFunction);
                };
            }
        };
        return directive;
    }
    
    function DataServicePageController($scope, syntax, config, RepoRestService, DSSelectionService, ConnectionSelectionService, SvcSourceSelectionService) {
        var vm = this;

        /*
         * When a data service is currently being deployed
         */
        $scope.$on('dataServicePageChanged', function (event, pageId) {
            vm.selectPage(pageId);
        });

        var DV_HOME_PAGE = 'dv-home';
        var DATASERVICE_SUMMARY_PAGE = 'dataservice-summary';
        var NEW_DATASERVICE_PAGE = 'dataservice-new';
        var IMPORT_DATASERVICE_PAGE = 'dataservice-import';
        var EXPORT_DATASERVICE_PAGE = 'dataservice-export';
        var EDIT_DATASERVICE_PAGE = 'dataservice-edit';
        var CLONE_DATASERVICE_PAGE = 'dataservice-clone';
        var TEST_DATASERVICE_PAGE = 'dataservice-test';
        var CONNECTION_SUMMARY_PAGE = 'connection-summary';
        var NEW_CONNECTION_PAGE = 'connection-new';
        var IMPORT_CONNECTION_PAGE = 'connection-import';
        var EDIT_CONNECTION_PAGE = 'connection-edit';
        var CLONE_CONNECTION_PAGE = 'connection-clone';
        var SERVICESOURCE_SUMMARY_PAGE = 'datasource-summary';
        var SERVICESOURCE_NEW_PAGE = 'svcsource-new';
        var SERVICESOURCE_IMPORT_PAGE = 'svcsource-import';
        var SERVICESOURCE_EDIT_PAGE = 'svcsource-edit';
        var SERVICESOURCE_CLONE_PAGE = 'svcsource-clone';
        var IMPORT_DRIVER_PAGE = 'driver-import';

        vm.selectNavItem = function(navItemId) {
            vm.selectedNavItem = navItemId;
        };

        vm.navItemSelected = function() {
            if (angular.isUndefined(vm.selectedNavItem) || vm.selectedNavItem === null)
                return false;

            return true;
        };

        var pages = {};
        pages[DV_HOME_PAGE] = {
            id: DV_HOME_PAGE,
            title: 'DV Home',
            icon: 'fa-dashboard',
            parent: null,
            template: config.pluginDir + syntax.FORWARD_SLASH +
                            pluginDirName + syntax.FORWARD_SLASH +
                            DV_HOME_PAGE + syntax.DOT + syntax.HTML
        };
        pages[DATASERVICE_SUMMARY_PAGE] = {
            id: DATASERVICE_SUMMARY_PAGE,
            title: 'Data Services',
            icon: 'fa-search',
            parent: DV_HOME_PAGE,
            template: config.pluginDir + syntax.FORWARD_SLASH +
                            pluginDirName + syntax.FORWARD_SLASH +
                            DATASERVICE_SUMMARY_PAGE + syntax.DOT + syntax.HTML
        };
        pages[NEW_DATASERVICE_PAGE] = {
            id: NEW_DATASERVICE_PAGE,
            title: 'New Data Service',
            icon: 'fa-plus',
            parent: DATASERVICE_SUMMARY_PAGE,
            template: config.pluginDir + syntax.FORWARD_SLASH +
                    pluginDirName + syntax.FORWARD_SLASH +
                    NEW_DATASERVICE_PAGE + syntax.DOT + syntax.HTML
        };
        pages[IMPORT_DATASERVICE_PAGE] = {
            id: IMPORT_DATASERVICE_PAGE,
            title: 'Import Data Service',
            icon: 'pficon-import',
            parent: DATASERVICE_SUMMARY_PAGE,
            template: config.pluginDir + syntax.FORWARD_SLASH +
                            pluginDirName + syntax.FORWARD_SLASH +
                            IMPORT_DATASERVICE_PAGE + syntax.DOT + syntax.HTML
        };
        pages[EXPORT_DATASERVICE_PAGE] = {
            id: EXPORT_DATASERVICE_PAGE,
            title: 'Export Data Service',
            icon: 'pficon-export',
            parent: DATASERVICE_SUMMARY_PAGE,
            template: config.pluginDir + syntax.FORWARD_SLASH +
                            pluginDirName + syntax.FORWARD_SLASH +
                            EXPORT_DATASERVICE_PAGE + syntax.DOT + syntax.HTML
        };
        pages[EDIT_DATASERVICE_PAGE] = {
            id: EDIT_DATASERVICE_PAGE,
            title: 'Edit Data Service',
            icon: 'pficon-edit',
            parent: DATASERVICE_SUMMARY_PAGE,
            template: config.pluginDir + syntax.FORWARD_SLASH +
                            pluginDirName + syntax.FORWARD_SLASH +
                            EDIT_DATASERVICE_PAGE + syntax.DOT + syntax.HTML
        };
        pages[CLONE_DATASERVICE_PAGE] = {
            id: CLONE_DATASERVICE_PAGE,
            title: 'Copy Data Service',
            icon: 'pficon-replicator',
            parent: DATASERVICE_SUMMARY_PAGE,
            template: config.pluginDir + syntax.FORWARD_SLASH +
                            pluginDirName + syntax.FORWARD_SLASH +
                            CLONE_DATASERVICE_PAGE + syntax.DOT + syntax.HTML
        };
        pages[TEST_DATASERVICE_PAGE] = {
            id: TEST_DATASERVICE_PAGE,
            title: 'Test Data Service',
            icon: 'pficon-running',
            parent: DATASERVICE_SUMMARY_PAGE,
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
        pages[NEW_CONNECTION_PAGE] = {
            id: NEW_CONNECTION_PAGE,
            title: 'New Connection',
            template: config.pluginDir + syntax.FORWARD_SLASH +
                    pluginDirName + syntax.FORWARD_SLASH +
                    'connections' + syntax.FORWARD_SLASH + NEW_CONNECTION_PAGE + syntax.DOT + syntax.HTML
        };
        pages[IMPORT_CONNECTION_PAGE] = {
            id: IMPORT_CONNECTION_PAGE,
            title: 'Import Connection',
            template: config.pluginDir + syntax.FORWARD_SLASH +
                            pluginDirName + syntax.FORWARD_SLASH +
                            'connections' + syntax.FORWARD_SLASH + IMPORT_CONNECTION_PAGE + syntax.DOT + syntax.HTML
        };
        pages[EDIT_CONNECTION_PAGE] = {
            id: EDIT_CONNECTION_PAGE,
            title: 'Edit Connection',
            template: config.pluginDir + syntax.FORWARD_SLASH +
                            pluginDirName + syntax.FORWARD_SLASH +
                            'connections' + syntax.FORWARD_SLASH + EDIT_CONNECTION_PAGE + syntax.DOT + syntax.HTML
        };
        pages[CLONE_CONNECTION_PAGE] = {
            id: CLONE_CONNECTION_PAGE,
            title: 'Clone Connection',
            template: config.pluginDir + syntax.FORWARD_SLASH +
                            pluginDirName + syntax.FORWARD_SLASH +
                            'connections' + syntax.FORWARD_SLASH + CLONE_CONNECTION_PAGE + syntax.DOT + syntax.HTML
        };
        pages[SERVICESOURCE_SUMMARY_PAGE] = {
            id: SERVICESOURCE_SUMMARY_PAGE,
            title: 'Service-source Summary',
            icon: 'pficon-storage-domain',
            parent: DV_HOME_PAGE,
            template: config.pluginDir + syntax.FORWARD_SLASH +
                            pluginDirName + syntax.FORWARD_SLASH +
                            'datasources' + syntax.FORWARD_SLASH + SERVICESOURCE_SUMMARY_PAGE + syntax.DOT + syntax.HTML
        };
        pages[SERVICESOURCE_NEW_PAGE] = {
            id: SERVICESOURCE_NEW_PAGE,
            title: 'New Service-source',
            icon: 'fa-plus',
            parent: SERVICESOURCE_SUMMARY_PAGE,
            template: config.pluginDir + syntax.FORWARD_SLASH +
                            pluginDirName + syntax.FORWARD_SLASH +
                            'datasources' + syntax.FORWARD_SLASH + SERVICESOURCE_NEW_PAGE + syntax.DOT + syntax.HTML
        };
        pages[SERVICESOURCE_EDIT_PAGE] = {
            id: SERVICESOURCE_EDIT_PAGE,
            title: 'Edit Service-source',
            icon: 'pficon-edit',
            parent: SERVICESOURCE_SUMMARY_PAGE,
            template: config.pluginDir + syntax.FORWARD_SLASH +
                            pluginDirName + syntax.FORWARD_SLASH +
                            'datasources' + syntax.FORWARD_SLASH + SERVICESOURCE_EDIT_PAGE + syntax.DOT + syntax.HTML
        };
        pages[SERVICESOURCE_CLONE_PAGE] = {
            id: SERVICESOURCE_CLONE_PAGE,
            title: 'Clone Service-source',
            icon: 'pficon-replicator',
            parent: SERVICESOURCE_SUMMARY_PAGE,
            template: config.pluginDir + syntax.FORWARD_SLASH +
                            pluginDirName + syntax.FORWARD_SLASH +
                            'datasources' + syntax.FORWARD_SLASH + SERVICESOURCE_CLONE_PAGE + syntax.DOT + syntax.HTML
        };
        pages[SERVICESOURCE_IMPORT_PAGE] = {
            id: SERVICESOURCE_IMPORT_PAGE,
            title: 'Import Service-source',
            icon: 'pficon-import',
            parent: SERVICESOURCE_SUMMARY_PAGE,
            template: config.pluginDir + syntax.FORWARD_SLASH +
                            pluginDirName + syntax.FORWARD_SLASH +
                            'datasources' + syntax.FORWARD_SLASH + SERVICESOURCE_IMPORT_PAGE + syntax.DOT + syntax.HTML
        };
        pages[IMPORT_DRIVER_PAGE] = {
            id: IMPORT_DRIVER_PAGE,
            title: 'Import Driver',
            template: config.pluginDir + syntax.FORWARD_SLASH +
                            pluginDirName + syntax.FORWARD_SLASH +
                            'connections' + syntax.FORWARD_SLASH + IMPORT_DRIVER_PAGE + syntax.DOT + syntax.HTML
        };

        vm.page = function(pageId) {
            if (angular.isUndefined(pageId))
                return null;

            return pages[pageId];
        };

        vm.pages = function(pageIds) {
            var selectedPages = [];
            if (angular.isUndefined(pageIds) || pageIds === null)
                return selectedPages;

            for (var i = 0; i < pageIds.length; i++) {
                var page = pages[pageIds[i]];
                if (angular.isUndefined(page))
                    continue;

                selectedPages.push(page);
            }

            return selectedPages;
        };

        vm.selectPage = function(pageId) {
            vm.selectedPage = pages[pageId];
        };

        vm.selectedPageCrumbs = function() {
            if (angular.isUndefined(vm.selectedPage) || vm.selectedPage === null)
                return [];

            var crumbs = [];
            var page = vm.selectedPage;
            while (angular.isDefined(page) && page !== null) {
                crumbs.unshift(page);
                if (page.parent === null)
                    page = null;
                else
                    page = pages[page.parent];
            }

            return crumbs;
        };

        vm.selectedPageId = function() {
            if (angular.isUndefined(vm.selectedPage) || vm.selectedPage === null)
                return '';

            return vm.selectedPage.id;
        };

        vm.selectedPageTitle = function() {
            if (angular.isUndefined(vm.selectedPage) || vm.selectedPage === null)
                return '';

            return vm.selectedPage.title;
        };

        /*
         * Service : get selected data service
         */
        vm.selectedDataservice = function () {
            return DSSelectionService.selectedDataService();
        };
        
        /*
         * Service : get selected Service Source
         */
        vm.selectedServiceSource = function () {
            return SvcSourceSelectionService.selectedServiceSource();
        };

        /*
         * Service : get selected connection
         */
        vm.selectedConnection = function () {
            return ConnectionSelectionService.selectedConnection();
        };

        /*
         * Service : get connection state
         */
        vm.getConnectionState = function (conn) {
            return ConnectionSelectionService.getConnectionState(conn);
        };

        vm.selectPage(DATASERVICE_SUMMARY_PAGE);
    }

})();
