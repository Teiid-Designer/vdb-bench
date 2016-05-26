(function () {
    'use strict';

    var pluginName = 'vdb-bench.dataservice';
    var templateName = 'dataservice.html';

    function getActiveCount() {
        return 3;
    }

    function getDataservices() {
        return [
            {
                "name": "MyService",
                "status": "Active",
                "description": "This is my DataService",
                "datasources": "WebServiceDS",
                "lastUpdate": "Feb 23, 2015 12:32 am"
            },
            {
                "name": "OracleService",
                "status": "Active",
                "description": "This service transforms the Oracle datasource",
                "datasources": "MyOracleDS",
                "lastUpdate": "Feb 23, 2015 12:32 am"
            },
            {
                "name": "MongoService",
                "status": "Inactive",
                "description": "This service shows the Mongo data that I want",
                "datasources": "MyMongoDS",
                "lastUpdate": "Feb 23, 2015 12:32 am"
            },
            {
                "name": "MultiSourceService",
                "status": "Active",
                "description": "This connects to a few sources",
                "datasources": "MyMongoDS,MyFileDS,WebServiceDS",
                "lastUpdate": "Feb 23, 2015 12:32 am"
            },
            {
                "name": "Join Service",
                "status": "Inactive",
                "description": "This DataService does a join of two sources",
                "datasources": "MyOracleDS,MyFileDS",
                "lastUpdate": "Feb 23, 2015 12:32 am"
            }
        ];
    }

    function getInactiveCount() {
        return 2;
    }

    angular
        .module(pluginName)
        .controller('DataserviceController', DataserviceController);

    DataserviceController.$inject = ['$modal', '$window', 'RepoRestService', 'VdbSelectionService',
                                                'SYNTAX', 'REST_URI', 'VDB_KEYS', '$scope'];

    function DataserviceController($modal, $window, RepoRestService, VdbSelectionService,
        SYNTAX, REST_URI, VDB_KEYS, $scope) {
        var vm = this;
        vm.m_dataservices = getDataservices();
        vm.m_numDataservicesActive = getActiveCount();
        vm.m_numDataservicesInactive = getInactiveCount();
        vm.m_numDataservices = (vm.m_numDataservicesActive + vm.m_numDataservicesInactive);
        vm.m_percentage = function (amount, total) {
            return Math.round(amount / total * 100) + "%";
        };
    }

})();