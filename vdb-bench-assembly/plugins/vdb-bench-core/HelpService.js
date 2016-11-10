/**
 * Dataservice Help Service
 *
 * Provides content for help components
 */
(function () {

    'use strict';

    var pluginName = 'vdb-bench.core';
    var pluginDirName = 'vdb-bench-core';

    angular
        .module(pluginName)
        .factory('HelpService', HelpService);

    HelpService.$inject = ['SYNTAX'];

    function HelpService(SYNTAX) {
        /*
         * Service instance to be returned
         */
        var service = {
            'ds-test-endpoint-search': "'<p>This url is formed using the odata specification. It can be copied into a new browser window to return the results in xml format.</p><p>Click the Search button to display the results in a formatted table.</p>'",
            'ds-test-select': "'<p>Choose the view from which results should be sought.</p><p>Select a limit to curtail the number of results returned</p>'",
            'ds-test-columns': "Select the columns to be included in the results.",
            'ds-test-where': "'<p>Create where clauses for filtering the results based on the values in each tuple.</p><p>Use the + button to add new where clauses (clauses are and-ed together) and remove them with the - buttons.</p>'",
            'ds-test-order-by': "Sort the results by column in ascending or descending order",
            'ds-test-results-table': "'<p>Use the column headers to sort the results or filter them by entering values.</p><p>Results are paginated in blocks of 25 and can be scrolled through with the controls at the foot of the table.</p>'",
            'ds-test-sql-search': "'<p>Use the teiid dialect of SQL to construct a query that interrogates the data service for data results.</p><p>Use the record limit to limit the number of results returned.</p><p>Set the starting record index to fetch a subset of results starting at the given row index.</p>'"
        };

        service.help = function(context) {
            if (_.isEmpty(context))
                return SYNTAX.EMPTY_STRING;

            return service[context];
        };

        return service;
    }
})();
