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
        var HELP_PAGE_DIR = "../../ds-builder-help/";
        var PAGE_NOT_FOUND = "page-not-found";
    	
        /*
         * Service instance to be returned
         */
        var service = {
            PAGE_NOT_FOUND : "help-page-not-found.html",
        	'connection-clone': "connection-clone-help.html",
        	'connection-new': "connection-new-help.html",
        	'dataservice-clone': "dataservices-clone-help.html",
        	'dataservice-edit': "dataservices-edit-help.html",
        	'dataservice-home': "dataservices-home-help.html",
        	'dataservice-import': "dataservices-import-help.html",
        	'dataservice-main': "dataservices-main-help.html",
        	'dataservice-new': "dataservices-new-help.html",
        	'dataservice-summary': "dataservices-summary-help.html",
        	'dataservice-test': "dataservices-test-help.html",
        	'datasource-summary': "datasource-summary-help.html",
        	'svcsource-clone': "svcsource-clone-help.html",
        	'svcsource-edit': "svcsource-edit-help.html",
        	'svcsource-import': "svcsource-import-help.html",
        	'svcsource-new': "svcsource-new-help.html",
        };

        /*
         * Obtain the help page for the specified page identifier.
         */
        service.getHelpPageUrl = function( pageId ) {
            if ( _.isEmpty( pageId ) ) {
                return service.getHelpPageUrl( PAGE_NOT_FOUND );
            }

            var htmlFileName = service[ pageId ];

            if ( _.isEmpty( htmlFileName ) ) {
                return service.getHelpPageUrl( PAGE_NOT_FOUND );
            }
            
            return ( HELP_PAGE_DIR + htmlFileName );
        };

        return service;
    }
})();
