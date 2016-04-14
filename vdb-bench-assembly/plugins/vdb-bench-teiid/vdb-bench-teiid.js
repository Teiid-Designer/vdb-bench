(function() {
    'use strict';

    angular.module('vdb-bench.teiid', [
        /*
         * Angular modules
         */
        'adf',
        'adf.structures.base',
        'adf.widget.teiid-connected',
        'adf.widget.teiid-data-sources',
        'adf.widget.teiid-translators',
        'adf.widget.teiid-vdbs',
        'adf.widget.teiid-vdb-states',

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