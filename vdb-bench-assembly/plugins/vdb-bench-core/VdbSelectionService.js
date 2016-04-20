/**
 * Vdb Selection Service
 *
 * Provides access to the selected vdb and its contents
 */
(function (vdbBench) {

    'use strict';

    angular
        .module('vdb-bench.core')
        .factory('VdbSelectionService', VdbSelectionService);

    VdbSelectionService.$inject = ['VDB_KEYS', 'RepoRestService', '$rootScope', '$filter'];

    function VdbSelectionService(VDB_KEYS, RepoRestService, $rootScope, $filter) {

        var selectedVdb = null;

        /**
         * Index of all the contents of the vdb
         * indexed according to their self link
         */
        var vdbIndex = {};

        /**
         * Recurse the data object and map it to the index
         * both being required for a tree layout
         */
        function indexInternal(dataObject, dataIndex) {
            var selfLink;

            for (var key in dataObject) {
                var value = dataObject[key];

                if (key == VDB_KEYS.LINKS) {
                    selfLink = value[0][VDB_KEYS.LINK_HREF];
                    dataIndex[selfLink] = dataObject;
                } else if (typeof (value) == 'object') {
                    indexInternal(value, dataIndex);
                }
            }
        }

        /**
         * Index the Vdb contents by link to make it easy to search
         * the vdb for a specific component
         */
        function indexVdb() {
            vdbIndex = {};

            if (!selectedVdb)
                return;

            indexInternal(selectedVdb, vdbIndex);
        }

        /*
         * Service instance to be returned
         */
        var service = {};

        /*
         * Service : get selected vdb
         */
        service.selected = function () {
            return selectedVdb;
        };

        /*
         * Service : set selected vdb
         */
        service.setSelected = function (selected) {
            if (selected == selectedVdb)
                return; // already selected

            // Set selected to the selected repository
            selectedVdb = selected;

            // Index the compoments of the vdb
            indexVdb();

            // Useful for broadcasting the selected vdb has been updated
            $rootScope.$broadcast("selectedVdbChanged", selectedVdb);
        };

        /*
         * Service : is a vdb selected
         */
        service.isVdbSelected = function () {
            return !_.isEmpty(selectedVdb);
        };

        /**
         * Retrieve the vdb xml for the selected vdb
         */
        service.selectedXml = function () {
            if (!service.isVdbSelected())
                return;

            try {
                selectedVdb.previewContent = "Loading ...";

                RepoRestService.getXml(selectedVdb).then(
                    function (xml) {
                        selectedVdb.previewContent = $filter('prettyXml')(xml);
                    },
                    function (response) {
                        selectedVdb.previewContent = "Error occurred: " + response.message;
                    });
            } catch (error) {
                selectedVdb.previewContent = "Error occurred: " + error.message;
            }
        };

        return service;
    }
})();