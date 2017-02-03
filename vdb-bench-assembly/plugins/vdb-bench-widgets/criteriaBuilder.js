(function () {
    'use strict';

    var pluginName = 'vdb-bench.widgets';
    var pluginDirName = 'vdb-bench-widgets';

    angular
        .module(pluginName)
        .directive('criteriaBuilder', CriteriaBuilder);

    CriteriaBuilder.$inject = ['CONFIG', 'SYNTAX'];
    CriteriaBuilderController.$inject = ['$scope', '$translate', 'REST_URI', 'SYNTAX', 'EditWizardService' ];

    function CriteriaBuilder(config, syntax) {
        var directive = {
            restrict: 'E',
            scope: {},
            controller: CriteriaBuilderController,
            controllerAs: 'vm',
            templateUrl: config.pluginDir + syntax.FORWARD_SLASH +
                pluginDirName + syntax.FORWARD_SLASH +
                'criteriaBuilder.html'
        };

        return directive;
    }

    function CriteriaBuilderController($scope, $translate, REST_URI, SYNTAX, EditWizardService) {
        var vm = this;

        var UNDEF = "<undef>";
        vm.lhSourceCols = [];
        vm.rhSourceCols = [];
        vm.operatorOptions = [ 
            { name: "=" }, 
            { name: "<>"}, 
            { name: "<" }, 
            { name: "<="}, 
            { name: ">" }, 
            { name: ">="} ];
        vm.combineKeywords = [ 
            { name: "AND" }, 
            { name: "OR"} ];
        vm.criteriaPredicates = [];
        vm.criteriaString = "";

        /*
         * When join wizard page is shown
         */
        $scope.$on('editWizardJoinCriteriaShown', function (event) {
            vm.lhSourceCols = EditWizardService.source1AvailableColumns();
            vm.rhSourceCols = EditWizardService.source2AvailableColumns();
            vm.criteriaPredicates = EditWizardService.criteriaPredicates();
            updateCriteriaString();
        });

        /**
         * Add the specified predicate at the specified index
         */
        vm.addCriteriaPredicate = function() {
            // Add a new predicate to the current list
            var newId = vm.criteriaPredicates.length;
            var predicate = {
                id : newId,
                lhColName : '',
                operatorName : vm.operatorOptions[0].name,
                rhColName : '',
                combineKeyword : vm.combineKeywords[0].name
            };
            vm.criteriaPredicates.push(predicate);

            //  Reset the wizard service predicates
            EditWizardService.setCriteriaPredicates(vm.criteriaPredicates);

            // Update the criteria
            updateCriteriaString();
        };

        /**
         * Event handler for removing a criteria predicate
         */
        vm.removeCriteriaPredicate = function (where) {
            if (_.isEmpty(where)) {
                return;
            }

            if (vm.criteriaPredicates.length === 0) {
                return;
            }

            var indxRemove = -1;
            // Determine the index of the predicate to be removed
            for(var i=0; i<vm.criteriaPredicates.length; i++) {
                if(where.id === vm.criteriaPredicates[i].id) {
                    indxRemove = i;
                    break;
                }
            }
            // Remove the predicate (if found).  Resequence the predicates
            if (indxRemove > -1) {
                vm.criteriaPredicates.splice(indxRemove,1);
                resequencePredicates();
            }

            EditWizardService.setCriteriaPredicates(vm.criteriaPredicates);

            updateCriteriaString();
        };

        // Resequences the predicates after one is removed
        function resequencePredicates() {
            for(var i=0; i<vm.criteriaPredicates.length; i++) {
                vm.criteriaPredicates[i].id = i;	
            }
        }

        /**
         * Access to the collection of where predicates
         */
        vm.getCriteriaPredicates = function() {
            return vm.criteriaPredicates;
        };

        /**
         * Handle operator changed
         */
        vm.operatorChanged = function( ) {
            updateCriteriaString();
        };

        /**
         * Handle LH column changed
         */
        vm.lhColumnChanged = function( ) {
            updateCriteriaString();
        };

        /**
         * Handle RH column changed
         */
        vm.rhColumnChanged = function( ) {
            updateCriteriaString();
        };

        /**
         * Handle combine keyword (AND|OR) changed
         */
        vm.combineKeywordChanged = function( ) {
            updateCriteriaString();
        };

        /**
         * Determine if the where predicate keyword should be shown
         */
        vm.shouldShowCombineKeyword = function(predicate) {
            if(predicate.id === vm.criteriaPredicates.length-1) {
                return false;
            }
            return true;
        };

        /**
         * Determine if the remove button should be disabled
         */
        vm.shouldDisableRemoveButton = function(predicate) {
            if(predicate && vm.criteriaPredicates.length === 1) {
                return true;
            }
            return false;
        };

        /**
         * Update the criteria string based on current selections
         */
        function updateCriteriaString() {
            var criteria = "(";
            var nPredicates = vm.criteriaPredicates.length;
            for(var i=0; i<nPredicates; i++) {
                var leftCol = vm.criteriaPredicates[i].lhColName;
                var rightCol = vm.criteriaPredicates[i].rhColName;
                var oper = vm.criteriaPredicates[i].operatorName;
                var keyword = vm.criteriaPredicates[i].combineKeyword;
                if(!leftCol || leftCol.length<1) leftCol = UNDEF;
                if(!rightCol || rightCol.length<1) rightCol = UNDEF;
                if(!oper || oper.length<1) oper = UNDEF;
                if(!keyword || keyword.length<1) keyword = UNDEF;
                criteria = criteria + leftCol + " " + oper + " " + rightCol;
                if(i < nPredicates-1) {
                    criteria = criteria + " " + keyword + " ";
                }
            }
            criteria = criteria + ")";
            vm.criteriaString = criteria;
        }
    }

})();
