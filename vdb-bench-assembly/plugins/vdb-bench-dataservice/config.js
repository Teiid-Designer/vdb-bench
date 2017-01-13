(function () {
    'use strict';

    var pluginDirName = 'vdb-bench-dataservice';
    var pluginName = 'vdb-bench.dataservice';
    var templateName = 'dataservice-main.html';

    var _module = angular
        .module(pluginName)
        .config(configure)
        .run(run);

    //
    // Can only inject providers in the 'config' phase
    // Instances of the providers, ie. service, factories and values are available during the
    // run phase. The exception is constants which being constant are available in both.
    //
    configure.$inject = ['$routeProvider', '$locationProvider', 'CONFIG', 'SYNTAX'];
    run.$inject = ['HawtioNav', 'preferencesRegistry', '$templateCache', 'SYNTAX', 'AuthService'];

    function configure($routeProvider, $locationProvider, config, syntax) {
        $locationProvider.html5Mode(true);

        $routeProvider.
            when(syntax.FORWARD_SLASH + pluginDirName, {
                templateUrl: config.pluginDir + syntax.FORWARD_SLASH +
                                    pluginDirName + syntax.FORWARD_SLASH +
                                    templateName
            });
    }

    function run(nav, preferencesRegistry, $templateCache, syntax, AuthService) {
        //
        // Check with the login service that we can display this plugin
        //
        AuthService.redirect();

        var builder = nav.builder();
        nav.add(builder.id(pluginName)
                   .href(
                        function () {
                            return syntax.FORWARD_SLASH + pluginDirName;
                        }
                    )
                   .title(
                        function () {
                            return 'DataServices';
                        }
                    )
                   .build());

        //
        // Removes the built-in hawtio preference tabs
        //
        if (preferencesRegistry.tabs) {
            delete preferencesRegistry.tabs['Console Logging'];
            delete preferencesRegistry.tabs.Reset;
        }

        //
        // Removes the html for rendering the preferences link in the user menu
        // Not required since we have a page preferences of our own
        //
        $templateCache.put("plugins/preferences/html/menuItem.html","");
    }

    hawtioPluginLoader.addModule(pluginName);
})();
