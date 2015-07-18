var Example;
(function (Example) {

  Example.PageController = Example._module.controller('Example.PageController', ['$scope', function($scope) {
    $scope.target = 'World!';
  }]);

})(Example || (Example = {}));


