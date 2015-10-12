var vdbBench = (function(vdbBench) {
    vdbBench.pluginName = 'vdb-bench';
    vdbBench.pluginPath = 'plugins/vdb-bench';
    vdbBench.templatePath = vdbBench.pluginPath + "/html";
    vdbBench.pagePath = vdbBench.templatePath + "/pages";
    vdbBench.widgetPath = vdbBench.templatePath + "/widgets";
    vdbBench.imgPath = vdbBench.pluginPath + "/img";

    vdbBench.RestServiceException = function(message) {
        this.message = message;
        this.toString = function () {
            return this.message;
        };
    }

    vdbBench._module = angular.module(vdbBench.pluginName, [ 'ngAnimate', 'ui.bootstrap', 'ui.codemirror', 'prettyXml', 'restangular' ]);

    var tab = undefined;

    vdbBench._module.config([
            '$routeProvider',
            'HawtioNavBuilderProvider',
            '$locationProvider',
            function($routeProvider, builder, $locationProvider) {
                $locationProvider.html5Mode(true);
                tab = builder.create().id(vdbBench.pluginName).title(
                        function() {
                            return 'Vdb Workbench';
                        }).href(function() {
                                return '/vdb-bench';
                            })
                                .subPath('Workspace', 'wkspace',
                                        builder.join(vdbBench.pagePath, 'wkspacePage.html')
                                )
                                .subPath(
                                        'Manage Repositories',
                                        'repos',
                                        builder
                                            .join(vdbBench.pagePath,
                                                'repoPage.html')).build();

                builder.configureRouting($routeProvider, tab);
            } ]);

    /**
     * Extends the exception handler to alert the user to an exception
     */
    vdbBench._module.config(function($provide) {
        $provide.decorator("$exceptionHandler", function($delegate) {
            return function(exception, cause) {
                $delegate(exception, cause);
                alert("An exception occurred:\n" + exception.message);
            };
        });
    });

    vdbBench._module.run([ 'HawtioNav', 'preferencesRegistry',
            function(HawtioNav, preferencesRegistry) {
                // preferencesRegistry.addTab("Repositor",
                // 'app/wiki/html/gitPreferences.html');

                HawtioNav.add(tab);
            } ]);

    hawtioPluginLoader.addModule(vdbBench.pluginName);

    return vdbBench;

})(vdbBench || {});
