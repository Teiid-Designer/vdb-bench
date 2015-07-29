var vdbBench = (function(vdbBench) {
	vdbBench._module.directive('repoControl', function() {
		return {
			// can be used as attribute or element
			restrict : 'E',
			// which markup this directive generates
			templateUrl : vdbBench.templatePath + '/repoWidget.html'
		};
	});

	return vdbBench;

})(vdbBench || {});