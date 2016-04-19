(function () {
    'use strict';

    var pluginName = 'vdb-bench.widgets';
    var pluginDirName = 'vdb-bench-widgets';

    angular
        .module(pluginName)
        .directive('panelDrawer', PanelDrawer)
        .directive('divider', Divider);

    PanelDrawer.$inject = ['$animate', '$animateCss', '$timeout', 'CONFIG', 'SYNTAX'];
    Divider.$inject = ['CONFIG', 'SYNTAX'];

    function PanelDrawer($animate, $animateCss, $timeout, config, syntax) {
        var directive = {
            restrict: 'E',
            transclude: true,
            replace: true, // Replaces the <panel-drawer> tag with the template
            scope: {},
            controller: PanelDrawerController,
            controllerAs: 'vm',
            templateUrl: config.pluginDir + syntax.FORWARD_SLASH +
                pluginDirName + syntax.FORWARD_SLASH +
                'panelDrawer.html',
            link: link
        };

        return directive;

        function PanelDrawerController() {
            var vm = this;
            var dividers = vm.dividers = [];

            vm.dividerExpanded = false;
            vm.selectedDivider = null;

            vm.select = function (divider) {
                angular.forEach(dividers, function (divider) {
                    divider.selected = false;
                });
                divider.selected = true;
                vm.selectedDivider = divider;

                vm.dividerExpanded = !vm.dividerExpanded;
            };

            vm.close = function() {
                angular.forEach(dividers, function (divider) {
                    divider.selected = false;
                });
                vm.selectedDivider = null;
                vm.dividerExpanded = false;
            };

            vm.isVisible = function (divider) {
                if (!vm.dividerExpanded)
                    return true; // always display if widget is collapsed

                // otherwise only visible if selected
                return divider.selected;
            };

            vm.addDivider = function (divider) {
                divider.selected = false;
                dividers.push(divider);
            };
        }

        function link(scope, element, attrs) {
            scope.$watch('vm.dividerExpanded', function (newValue, oldValue) {
                var divWidgetElement = element[0];
                var contentElement = angular.element(divWidgetElement.querySelector('.nav-content-outer'));

                if (newValue) {
                    expand(contentElement);
                } else {
                    collapse(contentElement);
                }
            });

            var currentTransition;

            function doTransition(change, tgtElement) {
                var newTransition = $transition(tgtElement, change);
                if (currentTransition) {
                    currentTransition.cancel();
                }
                currentTransition = newTransition;
                newTransition.then(newTransitionDone, newTransitionDone);
                return newTransition;

                function newTransitionDone() {
                    // Make sure it's this transition, otherwise, leave it alone.
                    if (currentTransition === newTransition) {
                        currentTransition = undefined;
                    }
                }
            }

            function expand(tgtElement) {
                tgtElement.removeClass('collapse')
                                .addClass('collapsing-width');

                var animation = $animateCss(tgtElement, {
                    addClass: 'in',
                    to: {
                        width: '35em',
                        transform: 'translateX(0em)'
                    }
                });

                animation.start().done(function () {
                    tgtElement.removeClass('collapsing-width')
                                    .addClass('collapse in');
                });
            }

            function collapse(tgtElement) {
                tgtElement.removeClass('collapse in')
                                .addClass('collapsing-width');

                var animation = $animateCss(tgtElement, {
                    to: {
                        width: '0',
                        transform: 'translateX(35em)'
                    }
                });

                animation.start().done(function () {
                    tgtElement.removeClass('collapsing-width')
                                    .addClass('collapse');
                });
            }
        }
    }

    function Divider(config, syntax) {
        var directive = {
            require: '^panelDrawer',
            restrict: 'E',
            transclude: true,
            scope: {
                title: '@'
            },
            link: function (scope, element, attrs, panelDrawerCtrl) {
                panelDrawerCtrl.addDivider(scope);
                //
                // Allow access to the panel drawer's close function
                // from this child divider's scope
                //
                scope.divm.closeDivider = panelDrawerCtrl.close;
            },
            templateUrl: config.pluginDir + syntax.FORWARD_SLASH +
                pluginDirName + syntax.FORWARD_SLASH +
                'divider.html',
            controller: DividerController,
            controllerAs: 'divm',
            bindToController: true
        };

        return directive;
    }

    function DividerController() {
        var divm = this;
    }
})();