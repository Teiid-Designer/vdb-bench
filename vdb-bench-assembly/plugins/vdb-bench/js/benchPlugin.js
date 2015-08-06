var vdbBench = (function(vdbBench) {
    vdbBench.pluginName = 'vdb-bench';
    vdbBench.templatePath = 'plugins/vdb-bench/html';
    vdbBench.pagePath = vdbBench.templatePath + "/pages";
    vdbBench.widgetPath = vdbBench.templatePath + "/widgets";

    vdbBench._module = angular.module(vdbBench.pluginName, [ 'ui.bootstrap' ]);

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
                }).subPath('Workspace', 'wkspace',
                        builder.join(vdbBench.pagePath, 'wkspacePage.html'))
                        .subPath(
                                'Manage Repositories',
                                'repos',
                                builder
                                        .join(vdbBench.pagePath,
                                                'repoPage.html')).build();
                builder.configureRouting($routeProvider, tab);
            } ]);

    vdbBench._module.run([ 'HawtioNav', 'preferencesRegistry',
            function(HawtioNav, preferencesRegistry) {
                // preferencesRegistry.addTab("Repositor",
                // 'app/wiki/html/gitPreferences.html');

                HawtioNav.add(tab);
            } ]);

    hawtioPluginLoader.addModule(vdbBench.pluginName);

    return vdbBench;

})(vdbBench || {});
