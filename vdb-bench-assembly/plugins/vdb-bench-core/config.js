(function () {
    'use strict';

    var pluginName = 'vdb-bench.core';

    angular
        .module(pluginName)
        .config(configure);

    /* @ngInject */
    configure.$inject = ['$provide'];

    function configure($provide) {
        $provide.decorator("$exceptionHandler", function($delegate) {
            return function(exception, cause) {
                $delegate(exception, cause);
                alert("An exception occurred:\n" + exception.message);
            };
        });
    }

    hawtioPluginLoader.addModule(pluginName);
})();