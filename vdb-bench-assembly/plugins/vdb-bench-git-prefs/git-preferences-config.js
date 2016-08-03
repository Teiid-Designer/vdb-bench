(function () {
    'use strict';

    var pluginDirName = 'vdb-bench-git-prefs';
    var pluginName = 'vdb-bench.git.prefs';
    var templateName = 'git-preferences.html';

    var _module = angular
        .module(pluginName)
        .run(run);

    run.$inject = ['preferencesRegistry', 'CONFIG', 'SYNTAX'];

    function run(preferencesRegistry, config, syntax) {
        preferencesRegistry.addTab("Git Repository Configurations",
                                    config.pluginDir + syntax.FORWARD_SLASH +
                                    pluginDirName + syntax.FORWARD_SLASH +
                                    templateName);
    }

    hawtioPluginLoader.addModule(pluginName);
})();