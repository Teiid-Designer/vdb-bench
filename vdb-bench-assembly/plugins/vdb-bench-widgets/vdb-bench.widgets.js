(function() {
    'use strict';

    var pluginName = 'vdb-bench.widgets';

    angular.module(pluginName, [
        /*
         * Order is not important. Angular makes a
         * pass to register all of the modules listed
         * and then when module a tries to use module b,
         * its components are available.
         */
        'ngAnimate',

        /*
         * Everybody has access to these.
         * We could place these under every feature area,
         * but this is easier to maintain.
         */
        'vdb-bench.core',

        /*
         * Feature areas
         */
        
    ]);

    hawtioPluginLoader.addModule(pluginName);
})();