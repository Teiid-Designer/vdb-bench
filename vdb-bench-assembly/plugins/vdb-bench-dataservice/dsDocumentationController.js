/*jshint loopfunc: true */

(function () {
    'use strict';

    var pluginName = 'vdb-bench.dataservice';
    var pluginDirName = 'vdb-bench-dataservice';

    angular
        .module(pluginName)
        .controller('DSDocumentationController', DSDocumentationController);

    DSDocumentationController.$inject = ['$scope', '$translate', 'CONFIG', 'SYNTAX', 'RepoSelectionService', 'DSSelectionService',
                                                'RepoRestService', 'DSPageService', '$interval', '$filter', '$timeout'];

    function DSDocumentationController($scope, $translate, CONFIG, SYNTAX, RepoSelectionService, DSSelectionService,
                                                RepoRestService, DSPageService) {
    	 var vm = this;

         /*
          * Set a custom title to the page including the data service's id
          */
         var page = DSPageService.page(DSPageService.TEST_DATASERVICE_PAGE);
         DSPageService.setCustomTitle(page.id, page.title + " '" + DSSelectionService.selectedDataService().keng__id + "'");
  
       
         /**
          * The odata endpoint
          */
         vm.odataUrl = function() {
             var hostName = RepoSelectionService.getSelected().host;
             var portValue = RepoSelectionService.getSelected().port;
             var vdbName = DSSelectionService.selectedDataServiceVdbName();
             var vdbVersion = DSSelectionService.selectedDataServiceVdbVersion();
             var modelName = DSSelectionService.selectedDataServiceViewModel();
             var serviceView = DSSelectionService.selectedDataServiceView();

             if (vdbName === SYNTAX.UNKNOWN || vdbVersion === SYNTAX.UNKNOWN || modelName === SYNTAX.UNKNOWN)
                 return null;

             return "https://" + hostName + SYNTAX.COLON + portValue + SYNTAX.FORWARD_SLASH +
                                     "odata4" + SYNTAX.FORWARD_SLASH + vdbName + SYNTAX.DOT + vdbVersion + SYNTAX.FORWARD_SLASH +
                                     modelName + SYNTAX.FORWARD_SLASH + serviceView + "?$format=json";
         }();
         
          /**
          * The JDBC connection string for the VDB
          * jdbc:teiid:myVDB@mm://localhost:31000
          */
         vm.jdbcConnectionString = function() {
        	 var hostName = RepoSelectionService.getSelected().host;
             var portValue = RepoSelectionService.getSelected().port;
             var vdbName = DSSelectionService.selectedDataServiceVdbName();
             var vdbVersion = DSSelectionService.selectedDataServiceVdbVersion();
             var modelName = DSSelectionService.selectedDataServiceViewModel();
             
             if (vdbName === SYNTAX.UNKNOWN || vdbVersion === SYNTAX.UNKNOWN)
                 return null;

             return "jdbc:teiid:" + vdbName + "@mm://" + hostName + SYNTAX.COLON + portValue + ";version=" + vdbVersion;
         }();
         
         vm.java1 = function() {
        	 return $translate.instant('dataservice-documentation.connecting-java1', { connection_string: vm.jdbcConnectionString });
         }();
         
         vm.odata1 = function() {
        	 return $translate.instant('dataservice-documentation.connecting-odata1', { url: vm.odataUrl });
         }();
        
    }
  

})();
