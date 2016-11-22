/**
 * Dataservice Page Service
 *
 * Provides and shares the current page view of the dataservice module
 */
(function () {

    'use strict';

    var pluginName = 'vdb-bench.dataservice';
    var pluginDirName = 'vdb-bench-dataservice';

    angular
        .module('vdb-bench.dataservice')
        .factory('DSPageService', DSPageService);

    DSPageService.$inject = ['SYNTAX', 'CONFIG', '$translate', '$rootScope'];

    function DSPageService(syntax, config, $translate, $rootScope) {
        /*
         * Service instance to be returned
         */
        var service = {
            DS_HOME_PAGE: 'dataservice-home',
            DATASERVICE_SUMMARY_PAGE: 'dataservice-summary',
            NEW_DATASERVICE_PAGE: 'dataservice-new',
            IMPORT_DATASERVICE_PAGE: 'dataservice-import',
            EXPORT_DATASERVICE_PAGE: 'dataservice-export',
            EDIT_DATASERVICE_PAGE: 'dataservice-edit',
            CLONE_DATASERVICE_PAGE: 'dataservice-clone',
            TEST_DATASERVICE_PAGE: 'dataservice-test',
            CONNECTION_SUMMARY_PAGE: 'connection-summary',
            NEW_CONNECTION_PAGE: 'connection-new',
            IMPORT_CONNECTION_PAGE: 'connection-import',
            EDIT_CONNECTION_PAGE: 'connection-edit',
            CLONE_CONNECTION_PAGE: 'connection-clone',
            SERVICESOURCE_SUMMARY_PAGE: 'datasource-summary',
            SERVICESOURCE_NEW_PAGE: 'svcsource-new',
            SERVICESOURCE_IMPORT_PAGE: 'svcsource-import',
            SERVICESOURCE_EDIT_PAGE: 'svcsource-edit',
            SERVICESOURCE_CLONE_PAGE: 'svcsource-clone',
            IMPORT_DRIVER_PAGE: 'driver-import'
        };

        var pages = {};

        /**
         * Translations are loaded asynchonously while $translate.instant
         * assumes the table is already present. Await the async loading
         * before setting the translations.
         */
        $rootScope.$on('$translateChangeSuccess', function () {
            pages[service.DS_HOME_PAGE].title = $translate.instant('dsPageService.homeTitle');
            pages[service.DATASERVICE_SUMMARY_PAGE].title = $translate.instant('shared.WhatSummary', 
                                                                               {what: $translate.instant('shared.DataService')});
            pages[service.NEW_DATASERVICE_PAGE].title = $translate.instant('shared.NewWhat',
                                                                           {what: $translate.instant('shared.DataService')});
            pages[service.IMPORT_DATASERVICE_PAGE].title = $translate.instant('shared.ImportWhat',
                                                                              {what: $translate.instant('shared.DataService')});
            pages[service.EXPORT_DATASERVICE_PAGE].title = $translate.instant('shared.ExportWhat', 
                                                                              {what: $translate.instant('shared.DataService')});
            pages[service.EDIT_DATASERVICE_PAGE].title = $translate.instant('shared.EditWhat',
                                                                            {what: $translate.instant('shared.DataService')});
            pages[service.CLONE_DATASERVICE_PAGE].title = $translate.instant('shared.CopyWhat',
                                                                             {what: $translate.instant('shared.DataService')});
            pages[service.TEST_DATASERVICE_PAGE].title = $translate.instant('dsPageService.testDataServiceTitle');
            pages[service.CONNECTION_SUMMARY_PAGE].title = $translate.instant('shared.WhatSummary',
                                                                              {what: $translate.instant('shared.Connection')});
            pages[service.NEW_CONNECTION_PAGE].title = $translate.instant('shared.NewWhat',
                                                                          {what: $translate.instant('shared.Connection')});
            pages[service.IMPORT_CONNECTION_PAGE].title = $translate.instant('shared.ImportWhat',
                                                                             {what: $translate.instant('shared.Connection')});
            pages[service.EDIT_CONNECTION_PAGE].title = $translate.instant('shared.EditWhat',
                                                                           {what: $translate.instant('shared.Connection')});
            pages[service.CLONE_CONNECTION_PAGE].title = $translate.instant('shared.CopyWhat',
                                                                            {what: $translate.instant('shared.Connection')});
            pages[service.SERVICESOURCE_SUMMARY_PAGE].title = $translate.instant('shared.WhatSummary',
                                                                                 {what: $translate.instant('shared.Source')});
            pages[service.SERVICESOURCE_NEW_PAGE].title = $translate.instant('dsPageService.configureSoureTitle');
            pages[service.SERVICESOURCE_EDIT_PAGE].title = $translate.instant('shared.EditWhat',
                                                                              {what: $translate.instant('shared.Source')});
            pages[service.SERVICESOURCE_CLONE_PAGE].title = $translate.instant('shared.CopyWhat',
                                                                               {what: $translate.instant('shared.Source')});
            pages[service.SERVICESOURCE_IMPORT_PAGE].title = $translate.instant('shared.ImportWhat',
                                                                                {what: $translate.instant('shared.Source')});
            pages[service.IMPORT_DRIVER_PAGE].title = $translate.instant('shared.ImportWhat',
                                                                         {what: $translate.instant('shared.Driver')});
        });

        pages[service.DS_HOME_PAGE] = {
            id: service.DS_HOME_PAGE,
            title: $translate.instant('dsPageService.homeTitle'),
            icon: 'fa-dashboard',
            parent: null,
            template: config.pluginDir + syntax.FORWARD_SLASH +
                            pluginDirName + syntax.FORWARD_SLASH +
                            service.DS_HOME_PAGE + syntax.DOT + syntax.HTML
        };
        pages[service.DATASERVICE_SUMMARY_PAGE] = {
            id: service.DATASERVICE_SUMMARY_PAGE,
            title: $translate.instant('shared.WhatSummary', {what: $translate.instant('shared.DataService')}),
            icon: 'fa-table',
            parent: null,
            template: config.pluginDir + syntax.FORWARD_SLASH +
                            pluginDirName + syntax.FORWARD_SLASH +
                            service.DATASERVICE_SUMMARY_PAGE + syntax.DOT + syntax.HTML
        };
        pages[service.NEW_DATASERVICE_PAGE] = {
            id: service.NEW_DATASERVICE_PAGE,
            title: $translate.instant('shared.NewWhat', {what: $translate.instant('shared.DataService')}),
            icon: 'fa-plus',
            parent: service.DATASERVICE_SUMMARY_PAGE,
            template: config.pluginDir + syntax.FORWARD_SLASH +
                            pluginDirName + syntax.FORWARD_SLASH +
                            service.NEW_DATASERVICE_PAGE + syntax.DOT + syntax.HTML
        };
        pages[service.IMPORT_DATASERVICE_PAGE] = {
            id: service.IMPORT_DATASERVICE_PAGE,
            title: $translate.instant('shared.ImportWhat', {what: $translate.instant('shared.DataService')}),
            icon: 'pficon-import',
            parent: service.DATASERVICE_SUMMARY_PAGE,
            template: config.pluginDir + syntax.FORWARD_SLASH +
                            pluginDirName + syntax.FORWARD_SLASH +
                            service.IMPORT_DATASERVICE_PAGE + syntax.DOT + syntax.HTML
        };
        pages[service.EXPORT_DATASERVICE_PAGE] = {
            id: service.EXPORT_DATASERVICE_PAGE,
            title: $translate.instant('shared.ExportWhat', {what: $translate.instant('shared.DataService')}),
            icon: 'pficon-export',
            parent: service.DATASERVICE_SUMMARY_PAGE,
            template: config.pluginDir + syntax.FORWARD_SLASH +
                            pluginDirName + syntax.FORWARD_SLASH +
                            service.EXPORT_DATASERVICE_PAGE + syntax.DOT + syntax.HTML
        };
        pages[service.EDIT_DATASERVICE_PAGE] = {
            id: service.EDIT_DATASERVICE_PAGE,
            title: $translate.instant('shared.EditWhat', {what: $translate.instant('shared.DataService')}),
            icon: 'pficon-edit',
            parent: service.DATASERVICE_SUMMARY_PAGE,
            template: config.pluginDir + syntax.FORWARD_SLASH +
                            pluginDirName + syntax.FORWARD_SLASH +
                            service.EDIT_DATASERVICE_PAGE + syntax.DOT + syntax.HTML
        };
        pages[service.CLONE_DATASERVICE_PAGE] = {
            id: service.CLONE_DATASERVICE_PAGE,
            title: $translate.instant('shared.CopyWhat', {what: $translate.instant('shared.DataService')}),
            icon: 'fa-copy',
            parent: service.DATASERVICE_SUMMARY_PAGE,
            template: config.pluginDir + syntax.FORWARD_SLASH +
                            pluginDirName + syntax.FORWARD_SLASH +
                            service.CLONE_DATASERVICE_PAGE + syntax.DOT + syntax.HTML
        };
        pages[service.TEST_DATASERVICE_PAGE] = {
            id: service.TEST_DATASERVICE_PAGE,
            title: $translate.instant('dsPageService.testDataServiceTitle'),
            icon: 'pficon-running',
            parent: service.DATASERVICE_SUMMARY_PAGE,
            template: config.pluginDir + syntax.FORWARD_SLASH +
                            pluginDirName + syntax.FORWARD_SLASH +
                            service.TEST_DATASERVICE_PAGE + syntax.DOT + syntax.HTML
        };
        pages[service.CONNECTION_SUMMARY_PAGE] = {
            id: service.CONNECTION_SUMMARY_PAGE,
            title: $translate.instant('shared.WhatSummary', {what: $translate.instant('shared.Connection')}),
            template: config.pluginDir + syntax.FORWARD_SLASH +
                            pluginDirName + syntax.FORWARD_SLASH +
                            'connections' + syntax.FORWARD_SLASH +
                            service.CONNECTION_SUMMARY_PAGE + syntax.DOT + syntax.HTML
        };
        pages[service.NEW_CONNECTION_PAGE] = {
            id: service.NEW_CONNECTION_PAGE,
            title: $translate.instant('shared.NewWhat', {what: $translate.instant('shared.Connection')}),
            template: config.pluginDir + syntax.FORWARD_SLASH +
                            pluginDirName + syntax.FORWARD_SLASH +
                            'connections' + syntax.FORWARD_SLASH +
                            service.NEW_CONNECTION_PAGE + syntax.DOT + syntax.HTML
        };
        pages[service.IMPORT_CONNECTION_PAGE] = {
            id: service.IMPORT_CONNECTION_PAGE,
            title: $translate.instant('shared.ImportWhat', {what: $translate.instant('shared.Connection')}),
            template: config.pluginDir + syntax.FORWARD_SLASH +
                            pluginDirName + syntax.FORWARD_SLASH +
                            'connections' + syntax.FORWARD_SLASH +
                            service.IMPORT_CONNECTION_PAGE + syntax.DOT + syntax.HTML
        };
        pages[service.EDIT_CONNECTION_PAGE] = {
            id: service.EDIT_CONNECTION_PAGE,
            title: $translate.instant('shared.EditWhat', {what: $translate.instant('shared.Connection')}),
            template: config.pluginDir + syntax.FORWARD_SLASH +
                            pluginDirName + syntax.FORWARD_SLASH +
                            'connections' + syntax.FORWARD_SLASH +
                            service.EDIT_CONNECTION_PAGE + syntax.DOT + syntax.HTML
        };
        pages[service.CLONE_CONNECTION_PAGE] = {
            id: service.CLONE_CONNECTION_PAGE,
            title: $translate.instant('shared.CopyWhat', {what: $translate.instant('shared.Connection')}),
            template: config.pluginDir + syntax.FORWARD_SLASH +
                            pluginDirName + syntax.FORWARD_SLASH +
                            'connections' + syntax.FORWARD_SLASH +
                            service.CLONE_CONNECTION_PAGE + syntax.DOT + syntax.HTML
        };
        pages[service.SERVICESOURCE_SUMMARY_PAGE] = {
            id: service.SERVICESOURCE_SUMMARY_PAGE,
            title: $translate.instant('shared.WhatSummary', {what: $translate.instant('shared.Source')}),
            icon: 'fa-database',
            parent: null,
            template: config.pluginDir + syntax.FORWARD_SLASH +
                            pluginDirName + syntax.FORWARD_SLASH +
                            'datasources' + syntax.FORWARD_SLASH +
                            service.SERVICESOURCE_SUMMARY_PAGE + syntax.DOT + syntax.HTML
        };
        pages[service.SERVICESOURCE_NEW_PAGE] = {
            id: service.SERVICESOURCE_NEW_PAGE,
            title: $translate.instant('dsPageService.configureSoureTitle'),
            icon: 'pficon-settings',
            parent: service.SERVICESOURCE_SUMMARY_PAGE,
            template: config.pluginDir + syntax.FORWARD_SLASH +
                            pluginDirName + syntax.FORWARD_SLASH +
                            'datasources' + syntax.FORWARD_SLASH +
                            service.SERVICESOURCE_NEW_PAGE + syntax.DOT + syntax.HTML
        };
        pages[service.SERVICESOURCE_EDIT_PAGE] = {
            id: service.SERVICESOURCE_EDIT_PAGE,
            title: $translate.instant('shared.EditWhat', {what: $translate.instant('shared.Source')}),
            icon: 'pficon-edit',
            parent: service.SERVICESOURCE_SUMMARY_PAGE,
            template: config.pluginDir + syntax.FORWARD_SLASH +
                            pluginDirName + syntax.FORWARD_SLASH +
                            'datasources' + syntax.FORWARD_SLASH +
                            service.SERVICESOURCE_EDIT_PAGE + syntax.DOT + syntax.HTML
        };
        pages[service.SERVICESOURCE_CLONE_PAGE] = {
            id: service.SERVICESOURCE_CLONE_PAGE,
            title: $translate.instant('shared.CopyWhat', {what: $translate.instant('shared.Source')}),
            icon: 'fa-copy',
            parent: service.SERVICESOURCE_SUMMARY_PAGE,
            template: config.pluginDir + syntax.FORWARD_SLASH +
                            pluginDirName + syntax.FORWARD_SLASH +
                            'datasources' + syntax.FORWARD_SLASH +
                            service.SERVICESOURCE_CLONE_PAGE + syntax.DOT + syntax.HTML
        };
        pages[service.SERVICESOURCE_IMPORT_PAGE] = {
            id: service.SERVICESOURCE_IMPORT_PAGE,
            title: $translate.instant('shared.ImportWhat', {what: $translate.instant('shared.Source')}),
            icon: 'pficon-import',
            parent: service.SERVICESOURCE_SUMMARY_PAGE,
            template: config.pluginDir + syntax.FORWARD_SLASH +
                            pluginDirName + syntax.FORWARD_SLASH +
                            'datasources' + syntax.FORWARD_SLASH +
                            service.SERVICESOURCE_IMPORT_PAGE + syntax.DOT + syntax.HTML
        };
        pages[service.IMPORT_DRIVER_PAGE] = {
            id: service.IMPORT_DRIVER_PAGE,
            title: $translate.instant('shared.ImportWhat', {what: $translate.instant('shared.Driver')}),
            template: config.pluginDir + syntax.FORWARD_SLASH +
                            pluginDirName + syntax.FORWARD_SLASH +
                            'connections' + syntax.FORWARD_SLASH +
                            service.IMPORT_DRIVER_PAGE + syntax.DOT + syntax.HTML
        };

        service.page = function(pageId) {
            if (_.isEmpty(pageId))
                return null;

            return pages[pageId];
        };

        service.pages = function(pageIds) {
            var selectedPages = [];
            if (_.isEmpty(pageIds))
                return selectedPages;

            for (var i = 0; i < pageIds.length; i++) {
                var page = pages[pageIds[i]];
                if (_.isEmpty(page))
                    continue;

                selectedPages.push(page);
            }

            return selectedPages;
        };

        service.pageCrumbs = function(targetPage) {
            if (_.isEmpty(targetPage))
                return [];

            var crumbs = [];
            var page = targetPage;
            while (! _.isEmpty(page)) {
                crumbs.unshift(page);
                if (page.parent === null)
                    page = null;
                else
                    page = pages[page.parent];
            }

            return crumbs;
        };

        return service;
    }
})();
