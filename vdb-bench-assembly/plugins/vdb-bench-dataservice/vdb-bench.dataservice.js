(function() {
    'use strict';

    angular.module('vdb-bench.dataservice', [
        /*
         * Angular modules
         */
        'ui.bootstrap',
        'ui.codemirror',
        'prettyXml',
        'angularUtils.directives.dirPagination',

        /*
         * Our reusable cross app code modules
         */
        'vdb-bench.core',
        'vdb-bench.widgets'

        /*
         * 3rd Party modules
         */
        
    ]);
})();