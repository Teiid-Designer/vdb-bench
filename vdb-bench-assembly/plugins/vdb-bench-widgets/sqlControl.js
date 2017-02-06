(function () {
    'use strict';

    var pluginName = 'vdb-bench.widgets';
    var pluginDirName = 'vdb-bench-widgets';

    angular
        .module(pluginName)
        .directive('sqlControl', SQLControl);

    SQLControl.$inject = ['CONFIG', 'SYNTAX'];
    SQLController.$inject = ['$scope', 'SYNTAX', 'RepoRestService', '$window', '$timeout'];

    function SQLControl(config, syntax) {
        var directive = {
            restrict: 'E',
            replace: true, // Replaces the <sql-import-control> tag with the template
            scope: {},
            bindToController: {
                editorHeight : '@',
                target : '@',
                queryText : '@',
                refresh : '='
            },
            controller: SQLController,
            controllerAs: 'vm',
            templateUrl: config.pluginDir + syntax.FORWARD_SLASH +
                pluginDirName + syntax.FORWARD_SLASH +
                'sqlControl.html'
        };

        return directive;
    }

    function SQLController($scope, SYNTAX, RepoRestService, $window, $timeout) {
        var vm = this;

        /*
         * Watch the refresh var and if it changes then the parent
         * of the directive has requested a refresh should be performed
         */
        $scope.$watch('vm.refresh', function(newValue, oldValue) {
            if (! newValue || _.isEmpty(vm.sqlEditor))
                return;

            $timeout(function () {
                vm.sqlEditor.refresh();
                vm.refresh = false;
            }, 100);
        });

        vm.showProgress = function(display) {
            vm.inProgress = display;
        };

        vm.showProgress(false);

        vm.limit = -1;
        vm.offset = 0;
        vm.showResultsTable = false;

        /**
         * Options for the codemirror editor used for previewing vdb xml
         */
        vm.sqlEditorOptions = {
            lineWrapping: true,
            lineNumbers: true,
            mode: 'text/x-sql'
        };

        vm.editorLoaded = function(_editor) {
            if (! _editor)
                return;

            _editor.setSize(null, vm.editorHeight);

            vm.sqlEditor = _editor;
        };

        vm.gridOptions = {
            paginationPageSizes: [25, 50, 75],
            paginationPageSize: 25,
            enableFiltering: true,
        };

        vm.refreshData = function(results) {
            if (!results)
                return;

            var columns = results.columns;
            var rows = results.rows;

            //
            // Define the column definitions
            //
            var columnDefs = [];
            for (var c = 0; c < columns.length; ++c) {
                var colDef = {
                    name : columns[c].label
                };
                columnDefs.push(colDef);
            }

            //
            // Define the row data
            //
            var data = [];
            for (var i = 0; i < rows.length; ++i) {
                var row = rows[i].row;
                var dataRow = {};

                for (var ci = 0; ci < columns.length; ++ci) {
                    var column = columns[ci];
                    dataRow[column.label] = row[ci];
                }

                data.push(dataRow);
            }

            vm.gridOptions.columnDefs = columnDefs;
            vm.gridOptions.data = data;
        };

        vm.query = function() {
            vm.showProgress(true);
            vm.errorMsg = null;

            //
            // Send the query to the rest service
            //
            RepoRestService.query(vm.queryText, vm.target, vm.limit, vm.offset).then(
                function (queryResults) {
                    vm.showProgress(false);
                    vm.showResultsTable = true;
                    vm.refreshData(queryResults);
                },
                function (response) {
                    vm.showProgress(false);
                    vm.errorMsg = RepoRestService.responseMessage(response);
                    vm.showResultsTable = false;
                });
        };
    }
})();
