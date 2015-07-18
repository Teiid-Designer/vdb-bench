var Example;
(function (Example) {
  Example.pluginName = 'vdbench';
  Example.templatePath = 'plugins/example/html';

  Example._module = angular.module(Example.pluginName, []);

  var tab = undefined;

  Example._module.config(['$routeProvider', 'HawtioNavBuilderProvider', '$locationProvider', function($routeProvider, builder, $locationProvider) {
    $locationProvider.html5Mode(true);
    tab = builder.create()
                 .id(Example.pluginName)
                 .title(function () { return 'Example'; })
                 .href(function() { return '/example'; })
                 .subPath('Page 1', 'page1', builder.join(Example.templatePath, 'page1.html'))
                 .build();
    builder.configureRouting($routeProvider, tab);
  }]);

  Example._module.run(['HawtioNav', function(HawtioNav) {
    HawtioNav.add(tab);
  }]);

  hawtioPluginLoader.addModule(Example.pluginName);

})(Example || (Example = {}));
