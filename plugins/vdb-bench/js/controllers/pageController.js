var vdbBench = (function(vdbBench) {

	vdbBench.PageController = vdbBench._module.controller('vdbBench.PageController',
																						[
																						 	'$scope', function($scope) {
																						 		$scope.target = 'World and his family!';
																						 	}
																						]);
	return vdbBench;

})(vdbBench || {});