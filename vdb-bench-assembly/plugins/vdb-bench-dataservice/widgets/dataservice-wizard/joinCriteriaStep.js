(function () {
    'use strict';

    var pluginName = 'vdb-bench.dataservice';
    var pluginDirName = 'vdb-bench-dataservice/widgets/dataservice-wizard';

    angular
        .module(pluginName)
        .directive('joinCriteriaStep', JoinCriteriaStep);

    JoinCriteriaStep.$inject = ['CONFIG', 'SYNTAX'];
    JoinCriteriaStepController.$inject = ['$rootScope', '$scope', '$translate', 'EditWizardService', 'SYNTAX'];

    function JoinCriteriaStep(config, syntax) {
        var directive = {
            restrict: 'E',
            scope: {},
            bindToController: {
                wizardActive : '='
            },
            controller: JoinCriteriaStepController,
            controllerAs: 'vm',
            templateUrl: config.pluginDir + syntax.FORWARD_SLASH +
                         pluginDirName + syntax.FORWARD_SLASH +
                         'joinCriteriaStep.html'
        };

        return directive;
    }

    function JoinCriteriaStepController($rootScope, $scope, $translate, EditWizardService, SYNTAX) {
        var vm = this;

        vm.stepTitle = $translate.instant('joinCriteriaStep.stepTitle');
        vm.instructionMessage = "";
        vm.nextEnablement = updateNextEnablement();

        /*
         * Join Criteria step shown
         */
        vm.joinCriteriaStepShown = function() {
            // Broadcast page shown
            $rootScope.$broadcast("editWizardJoinCriteriaShown");
            updateNextEnablement();
        };

        $scope.$on("editWizardJoinCriteriaChanged", function (event) {
            updateNextEnablement();
        });

        /*
         * Update next enablement
         */
        function updateNextEnablement() {
            var criteriaPredicates = EditWizardService.criteriaPredicates();
            var criteriaComplete = EditWizardService.criteriaComplete();
            if(criteriaPredicates.length===0) {
                vm.nextEnablement = false;
                vm.instructionMessage = $translate.instant('joinCriteriaStep.addCriteriaConditionInstructionMsg');
            } else if(!criteriaComplete) {
                vm.nextEnablement = false;
                vm.instructionMessage = $translate.instant('joinCriteriaStep.finishCriteriaConditionInstructionMsg');
            } else {
                vm.nextEnablement = true;
                vm.instructionMessage = $translate.instant('joinCriteriaStep.clickFinishInstructionMsg');
            }
        }

    }

})();
