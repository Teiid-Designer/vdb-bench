var vdbBench = (function(vdbBench) {
	vdbBench.pluginName = 'vdb-bench';
	vdbBench.templatePath = 'plugins/vdb-bench/html';

	vdbBench._module = angular.module(vdbBench.pluginName, ['ui.bootstrap']);

	var tab = undefined;

	vdbBench._module.config(
							[
	                           '$routeProvider',
	                           'HawtioNavBuilderProvider',
	                           '$locationProvider',
	                           function($routeProvider, builder, $locationProvider) {
	                        	   $locationProvider.html5Mode(true);
	                        	   tab = builder.create()
	                        	   					.id(vdbBench.pluginName)
	                        	   					.title(
	                        	   							function() {
	                        	   								return 'Vdb Workbench';
	                        	   							})
	                        	   					.href(
	                        	   							function() {
	                        	   								return '/vdb-bench';
	                        	   							})
	                        	   					.subPath('Workspace', 'wkspace', builder.join(vdbBench.templatePath, 'wkspace.html'))
	                        	   					.build();
	                        	   builder.configureRouting($routeProvider, tab);
	                           }
	                        ]
						);

	vdbBench._module.run(
							[
							 	'HawtioNav',
							 	function(HawtioNav) {
							 		HawtioNav.add(tab);
							 	}
							 ]
						);

	hawtioPluginLoader.addModule(vdbBench.pluginName);

	return vdbBench;

})(vdbBench || {});
