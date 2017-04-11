(function () {
    'use strict';

    var pluginName = 'vdb-bench.dataservice';
    var pluginDirName = 'vdb-bench-dataservice';

    angular
        .module(pluginName)
        .directive('bodyClick', BodyClickDirective)
        .controller('DataServicePageController', DataServicePageController);

    BodyClickDirective.$inject = ['$parse', '$document'];
    DataServicePageController.$inject = ['$scope', 'SYNTAX', 'CONFIG', 'RepoRestService', 'DSSelectionService', 'DatasourceWizardService',
                                         'EditWizardService', 'ConnectionSelectionService', 'SvcSourceSelectionService', 'DSPageService'];

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
    
    function DataServicePageController($scope, syntax, config, RepoRestService, DSSelectionService, DatasourceWizardService,
                                       EditWizardService, ConnectionSelectionService, SvcSourceSelectionService, DSPageService) {
        var vm = this;

        vm.dataserviceNav = "";
        vm.datasourceNav = "";
        vm.homeNav = "";

        /*
         * When a data service is currently being deployed
         */
        $scope.$on('dataServicePageChanged', function (event, pageId) {
            vm.selectPage(pageId);
        });

        vm.selectNavItem = function(navItemId) {
            vm.selectedNavItem = navItemId;
        };

        vm.navItemSelected = function() {
            if (_.isEmpty(vm.selectedNavItem))
                return false;

            return true;
        };

        vm.page = function(pageId) {
            return DSPageService.page(pageId);
        };

        vm.pages = function(pageIds) {
            return DSPageService.pages(pageIds);
        };

        vm.selectPage = function(pageId) {
            if(pageId === DSPageService.SERVICESOURCE_NEW_PAGE) {
                DatasourceWizardService.init(null,null);
            } else if(pageId == DSPageService.NEW_DATASERVICE_PAGE) {
                EditWizardService.init(null,null);
            } else if(pageId === DSPageService.SERVICESOURCE_SUMMARY_PAGE) {
                SvcSourceSelectionService.refresh();
            } else if(pageId === DSPageService.DATASERVICE_SUMMARY_PAGE) {
                DSSelectionService.refresh();
            } else if(pageId == DSPageService.TEST_DATASERVICE_PAGE) {
                DSSelectionService.deploySelectedDataService();
            }

            vm.prevPageId = vm.selectedPageId();
            vm.selectedPage = DSPageService.page(pageId);
            DSPageService.setCustomTitle(pageId, null);
            DSPageService.setCustomHelpId(pageId, null);

            setNavActiveState(vm.selectedPage);
        };

        function setNavActiveState(page) {
            vm.dataserviceNav = "";
            vm.datasourceNav = "";
            vm.homeNav = "";
            var activeNav = "";
            // No parent
            if(page.parent===null) {
                activeNav = page.id;
            // Parent defines active nav
            } else {
                activeNav = page.parent;
            }
            if(activeNav === 'dataservice-summary') {
                vm.dataserviceNav = "active";
            } else if(activeNav === 'datasource-summary') {
                vm.datasourceNav = "active";
            } else if(activeNav === 'dataservice-home') {
                vm.homeNav = "active";
            }
        }

        vm.selectedPageCrumbs = function() {
            return DSPageService.pageCrumbs(vm.selectedPage);
        };

        vm.selectedPageId = function() {
            if (_.isEmpty(vm.selectedPage))
                return '';

            return vm.selectedPage.id;
        };

        vm.previousPageId = function() {
            if (_.isEmpty(vm.prevPageId))
                return '';

            return vm.prevPageId;
        };

        vm.isPreferencePage = function() {
            if (_.isEmpty(vm.selectedPage))
                return false;

            return vm.selectedPageId() === DSPageService.DS_PREFERENCE_PAGE;
        };

        vm.selectedPageTitle = function() {
            if (_.isEmpty(vm.selectedPage))
                return '';

            if (vm.selectedPage.customTitle)
                return vm.selectedPage.customTitle;

            return vm.selectedPage.title;
        };

        vm.selectedPageHelpId = function() {
            if (_.isEmpty(vm.selectedPage))
                return '';

            if (vm.selectedPage.customHelpId)
                return vm.selectedPage.customHelpId;

            return vm.selectedPage.helpId;
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

        /*
         * Navigate to the preferences page
         */
         vm.openPreferences = function () {
             vm.selectPage(DSPageService.DS_PREFERENCE_PAGE);
         };

        vm.selectPage(DSPageService.DATASERVICE_SUMMARY_PAGE);
    }

})();
