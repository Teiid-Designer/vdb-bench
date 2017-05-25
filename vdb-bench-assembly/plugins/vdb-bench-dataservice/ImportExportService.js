/**
 * ImportExportService
 *   - maintain state information for import-export tasks
 *
 */
(function () {

    'use strict';

    angular
        .module('vdb-bench.dataservice')
        .factory('ImportExportService', ImportExportService);

    ImportExportService.$inject = ['$rootScope', '$translate', 'RepoRestService'];

    function ImportExportService($rootScope, $translate, RepoRestService) {

        var impExp = {};

        impExp.storageTypes = [];

        /*
         * Service instance to be returned
         */
        var service = {};

        /*
         * Init the service.
         *   - Loads storage types and fires event when complete
         */
        service.init = function ( importExport ) {
                // Gets the available storage types
                try {
                    RepoRestService.availableStorageTypes().then(
                   function (sTypes) {
                       // remove 'file' storage type as it is not part of export wizard and
                       // currently data service import is not allowed
                       impExp.storageTypes = sTypes.filter( function( storageType ) {
                           return ( storageType.name !== "file" );
                       } );
                       if(importExport === 'import') {
                           // Broadcast init finished
                           $rootScope.$broadcast("importInitFinished");
                       } else if(importExport === 'export') {
                           // Broadcast init finished
                           $rootScope.$broadcast("exportInitFinished");
                       }
                   },
                   function (response) {
                       alert(response.data.error);
                       if(importExport === 'import') {
                           // Broadcast init finished
                           $rootScope.$broadcast("importInitFinished");
                       } else if(importExport === 'export') {
                           // Broadcast init finished
                           $rootScope.$broadcast("exportInitFinished");
                       }
                   });
               } catch (error) {
                   alert("An exception occurred:\n" + error.message);
                   if(importExport === 'import') {
                       // Broadcast init finished
                       $rootScope.$broadcast("importInitFinished");
                   } else if(importExport === 'export') {
                       // Broadcast init finished
                       $rootScope.$broadcast("exportInitFinished");
                   }
               }
        };

        /*
         * Loads storage types and fires event when complete
         */
        service.storageTypes = function ( ) {
            return impExp.storageTypes;
        };

        return service;
    }

})();
