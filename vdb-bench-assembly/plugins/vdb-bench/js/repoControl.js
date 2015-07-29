vdbBench._module.directive('repoControl', function() {
	return {
		// can be used as attribute or element
		restrict : 'AE',
		// which markup this directive generates
		template : '<p>Hello</p><button>-</button>' + '<div>0</div>' + '<button>+</button>'
	};
});