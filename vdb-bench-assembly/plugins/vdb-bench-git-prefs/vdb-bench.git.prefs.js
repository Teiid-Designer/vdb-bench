(function() {
    'use strict';

    angular.module('vdb-bench.git.prefs', [
        /*
         * Order is not important. Angular makes a
         * pass to register all of the modules listed
         * and then when module a tries to use module b,
         * its components are available.
         */

        'vdb-bench.core'

        /*
         * Everybody has access to these.
         * We could place these under every feature area,
         * but this is easier to maintain.
         */

        /*
         * Feature areas
         */

    ]);
})();