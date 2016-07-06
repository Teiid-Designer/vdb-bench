(function () {
    'use strict';

    var pluginName = 'vdb-bench.widgets';
    var pluginDirName = 'vdb-bench-widgets';

    angular
        .module(pluginName)
        .directive('sqlControl', SQLControl);

    SQLControl.$inject = ['CONFIG', 'SYNTAX'];
    SQLController.$inject = ['$scope', 'SYNTAX', 'RepoRestService', '$window'];

    function SQLControl(config, syntax) {
        var directive = {
            restrict: 'E',
            replace: true, // Replaces the <sql-import-control> tag with the template
            scope: {},
            bindToController: {
                editorHeight : '@',
                target : '@'
            },
            controller: SQLController,
            controllerAs: 'vm',
            templateUrl: config.pluginDir + syntax.FORWARD_SLASH +
                pluginDirName + syntax.FORWARD_SLASH +
                'sqlControl.html'
        };

        return directive;
    }

    function SQLController($scope, SYNTAX, RepoRestService, $window) {
        var vm = this;

        vm.showProgress = function(display) {
            vm.inProgress = display;
        };

        vm.showProgress(false);

        vm.limit = -1;
        vm.offset = 0;
        vm.queryText = 'SELECT * from example;';

        /**
         * Options for the codemirror editor used for previewing vdb xml
         */
        vm.sqlEditorOptions = {
            lineWrapping: true,
            lineNumbers: true,
            mode: 'text/x-sql'
        };

        vm.editorLoaded = function(_editor) {
            _editor.setSize(null, vm.editorHeight);
        };

        vm.exampleColDefs = [
            { name: 'Column 1' },
            { name: 'Column 2' },
            { name: 'Column 3' }
        ];

        vm.exampleData = [
            {
                "Column 1": "value 1",
                "Column 2": "value 2",
                "Column 3": "value 3"
            },
            {
                "Column 1": "value 1",
                "Column 2": "value 2",
                "Column 3": "value 3"
            },
            {
                "Column 1": "value 1",
                "Column 2": "value 2",
                "Column 3": "value 3"
            }
        ];

        vm.gridOptions = {
            columnDefs: vm.exampleColDefs,
            data: vm.exampleData
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
           console.log("Querying! : " + vm.target + vm.queryText);

            vm.showProgress(true);
            vm.errorMsg = null;

            //
            // Send the query to the rest service
            //
            RepoRestService.query(vm.queryText, vm.target, vm.limit, vm.offset).then(
                function (queryResults) {
                    vm.showProgress(false);
                    vm.refreshData(queryResults);
                },
                function (response) {
                    vm.showProgress(false);
                    vm.errorMsg = response.data.error;
                });
        };
    }
})();
