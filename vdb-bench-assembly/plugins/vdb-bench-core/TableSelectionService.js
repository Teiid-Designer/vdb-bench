/**
 * Table Selection Service
 *
 * Provides simple API for managing table selections
 */
(function () {

    'use strict';

    angular
        .module('vdb-bench.core')
        .factory('TableSelectionService', TableSelectionService);

    TableSelectionService.$inject = ['$rootScope'];

    function TableSelectionService($rootScope) {

        var table = {};
        table.table = null;

        /*
         * Service instance to be returned
         */
        var service = {};

        /*
         * Select the given table
         */
        service.selectTable = function(aTable) {
            //
            // Set the selected table
            //
            table.table = aTable;

            // Useful for broadcasting the selected table has been updated
            $rootScope.$broadcast("selectedTableChanged", table.table);
        };

        /*
         * return selected table
         */
        service.selectedTable = function() {
            return table.table;
        };

        /*
         * return selected table
         */
        service.hasSelectedTable = function() {
            if (! angular.isDefined(table.table))
                return false;

            if (_.isEmpty(table.table))
                return false;

            if (table.table === null)
                return false;

            return true;
        };

        return service;
    }

})();
