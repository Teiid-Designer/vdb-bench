var vdbBench = (function (vdbBench) {
        vdbBench._module
            .directive('dividerWidget', ['$animate', '$animateCss', function ($animate, $animateCss, $timeout) {
                return {
                    restrict: 'E',
                    transclude: true,
                    replace: true, // Replaces the <divider-widget> tag with the template
                    scope: {},
                    controller: function ($scope) {
                        var dividers = $scope.dividers = [];

                        $scope.dividerExpanded = false;
                        $scope.selectedDivider = null;

                        $scope.select = function (divider) {
                            angular.forEach(dividers, function (divider) {
                                divider.selected = false;
                            });
                            divider.selected = true;
                            $scope.selectedDivider = divider;

                            $scope.dividerExpanded = ! $scope.dividerExpanded;
                        };

                        $scope.isVisible = function(divider) {
                            if (! $scope.dividerExpanded)
                                return true; // always display if widget is collapsed

                            // otherwise only visible if selected
                            return divider.selected;
                        };

                        this.addDivider = function (divider) {
                            divider.selected = false;
                            dividers.push(divider);
                        };
                    },
                    templateUrl: vdbBench.widgetPath + '/dividerWidget.html',
                    link: function (scope, element, attrs) {

                        scope.$watch('dividerExpanded', function (newValue, oldValue) {
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
                            tgtElement.removeClass('collapse').addClass('collapsing-width');

                            var animation = $animateCss(tgtElement, {
                                addClass: 'in',
                                to: { width: '90%' }
                            });

                            animation.start().done(function() {
                                tgtElement.removeClass('collapsing-width');
                                tgtElement.addClass('collapse in');
                            });
                        }

                        function collapse(tgtElement) {
                            tgtElement.removeClass('collapse in').addClass('collapsing-width');

                            var animation = $animateCss(tgtElement, {
                                to: { width: '0' }
                            });

                            animation.start().done(function() {
                                tgtElement.removeClass('collapsing-width');
                                tgtElement.addClass('collapse');
                            });
                        }
                    }
                };
            }])
            .directive('divider', function () {
                return {
                    require: '^dividerWidget',
                    restrict: 'E',
                    transclude: true,
                    scope: {
                        title: '@'
                    },
                    link: function (scope, element, attrs, dividerCtrl) {
                        dividerCtrl.addDivider(scope);
                    },
                    template: '<div ng-show="selected" ng-transclude></div>'
                };
            });

        return vdbBench;
    })
    (vdbBench || {});
