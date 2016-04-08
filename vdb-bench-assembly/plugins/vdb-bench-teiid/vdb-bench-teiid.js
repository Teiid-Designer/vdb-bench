(function() {
    'use strict';

    angular.module('vdb-bench.teiid', [
        /*
         * Angular modules
         */
        'ui.bootstrap',
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