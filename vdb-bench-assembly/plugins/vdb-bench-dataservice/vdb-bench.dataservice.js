(function() {
    'use strict';

    angular.module('vdb-bench.dataservice', [
        /*
         * Angular modules
         */
        'adf',
        'adf.structures.base',
        'adf.widget.ds-welcome',
        'adf.widget.ds-dataservices',
        'adf.widget.ds-svcsources',
        'adf.widget.teiid-connected',
        'ui.bootstrap',
        'ui.codemirror',
        'prettyXml',
        'angularUtils.directives.dirPagination',
        'patternfly.views',
        'patternfly.toolbars',
        'patternfly.wizard',
        'ui.select',
        'ui.grid',
        'ui.grid.pagination',

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