/*jshint loopfunc: true */

(function () {
    'use strict';

    var pluginName = 'vdb-bench.dataservice';
    var pluginDirName = 'vdb-bench-dataservice';

    angular
        .module(pluginName)
        .controller('DSDocumentationController', DSDocumentationController);

    DSDocumentationController.$inject = ['$scope', '$translate', 'CONFIG', 'SYNTAX', 'RepoSelectionService', 'DSSelectionService',
                                                'RepoRestService', 'DSPageService'];

    function DSDocumentationController($scope, $translate, CONFIG, SYNTAX, RepoSelectionService, DSSelectionService,
                                                RepoRestService, DSPageService) {
    	 var vm = this;

         /*
          * Set a custom title to the page including the data service's id
          */
         var page = DSPageService.page(DSPageService.TEST_DATASERVICE_PAGE);
         DSPageService.setCustomTitle(page.id, page.title + " '" + DSSelectionService.selectedDataService().keng__id + "'");
         vm.isLoading=true;
        
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
             if(serviceView === 'unknown') {
                 var vdbIndx = vdbName.lastIndexOf("VDB");
                 if(vdbIndx>-1) {
                     serviceView = vdbName.substring(0,vdbIndx)+"View";
                 }
             }

             if (vdbName === SYNTAX.UNKNOWN || vdbVersion === SYNTAX.UNKNOWN || modelName === SYNTAX.UNKNOWN)
                 return null;

             return "https://" + hostName + SYNTAX.COLON + portValue + SYNTAX.FORWARD_SLASH +
                                     "odata4" + SYNTAX.FORWARD_SLASH + vdbName + SYNTAX.DOT + vdbVersion + SYNTAX.FORWARD_SLASH +
                                     modelName + SYNTAX.FORWARD_SLASH + serviceView + "?$format=json";
         }();
         
          vm.init = function() {
             vm.connectionDetailTitle = $translate.instant('dataservice-documentation.connection-detail-title', { dsName: DSSelectionService.selectedDataService().keng__id });
             try {
                 RepoRestService.getTeiidStatus().then(
                     function (teiidStatus) {
                        var port = teiidStatus.tko__jdbcPort;
                        var isSecure = teiidStatus.tko__jdbcSecure;
                    	 
                        setJdbcConnectionString(port, isSecure);
                  },
                     function (response) {
                      // Some kind of error has occurred, just default to 31000
                	  setJdbcConnectionString("31000");
                     });
             } catch (error) {
            	 setJdbcConnectionString("31000");
             }
            
         }();
         
         function setJdbcConnectionString(port,isSecure) {
        	 var hostName = RepoSelectionService.getSelected().host;
             var vdbName = DSSelectionService.selectedDataServiceVdbName();
             var vdbVersion = DSSelectionService.selectedDataServiceVdbVersion();
             var modelName = DSSelectionService.selectedDataServiceViewModel();
             
             var protocol = isSecure === false ? "@mm://" : "@mms://";
             
             if (vdbName === SYNTAX.UNKNOWN || vdbVersion === SYNTAX.UNKNOWN)
            	 vm.jdbcConnectionString="not found";

             vm.jdbcConnectionString = "jdbc:teiid:" + vdbName + protocol + hostName + SYNTAX.COLON + port + ";version=" + vdbVersion;
             vm.java1 = $translate.instant('dataservice-documentation.connecting-java', { connection_string: vm.jdbcConnectionString });
             vm.isLoading=false;
         }

         vm.odata1 = function() {
        	 return $translate.instant('dataservice-documentation.connecting-odata', { url: vm.odataUrl });
         }();
         
        
                           
    }
  

})();
