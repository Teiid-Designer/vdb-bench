(function () {
    'use strict';

    var pluginDirName = 'vdb-bench-teiid-prefs';
    var pluginName = 'vdb-bench.teiid.prefs';
    var templateName = 'teiid-preferences.html';

    var _module = angular
        .module(pluginName)
        .run(run);

    run.$inject = ['preferencesRegistry', 'CONFIG', 'SYNTAX'];

    function run(preferencesRegistry, config, syntax) {
        preferencesRegistry.addTab("Teiid Settings",
                                    config.pluginDir + syntax.FORWARD_SLASH +
                                    pluginDirName + syntax.FORWARD_SLASH +
                                    templateName);
    }

    hawtioPluginLoader.addModule(pluginName);
})();