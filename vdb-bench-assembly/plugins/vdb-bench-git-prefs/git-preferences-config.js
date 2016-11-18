(function () {
    'use strict';

    var pluginDirName = 'vdb-bench-git-prefs';
    var pluginName = 'vdb-bench.git.prefs';
    var templateName = 'git-preferences.html';

    var _module = angular
        .module(pluginName)
        .run(run);

    run.$inject = ['$rootScope', '$translate', 'preferencesRegistry', 'CONFIG', 'SYNTAX'];

    function run($rootScope, $translate, preferencesRegistry, config, syntax) {
        $rootScope.$on('$translateChangeSuccess', function () {
            preferencesRegistry.addTab($translate.instant('git-preferences-config.tabTitle'),
                                       config.pluginDir + syntax.FORWARD_SLASH +
                                       pluginDirName + syntax.FORWARD_SLASH +
                                       templateName);
        });
    }

    hawtioPluginLoader.addModule(pluginName);
})();