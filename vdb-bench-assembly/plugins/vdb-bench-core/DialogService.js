/**
 * Dialog Service
 *
 * Provides standard dialog windows for display of information
 */
(function () {

    'use strict';

    var pluginName = 'vdb-bench.core';
    var pluginDirName = 'vdb-bench-core';

    angular
        .module(pluginName)
        .controller('ModalDialogCtrl', ModalDialogCtrl)
        .factory('DialogService', DialogService);

    ModalDialogCtrl.$inject = ['$scope','$uibModalInstance'];

    DialogService.$inject = ['SYNTAX', 'CONFIG', '$uibModal'];

    function ModalDialogCtrl($scope, $uibModalInstance) {
    	$scope.close = function(){
    		$uibModalInstance.close();
    		$scope.$destroy();
    	}; // end close
    }

    function DialogService(SYNTAX, CONFIG, $uibModal) {

        /*
         * Service instance to be returned
         */
        var service = {};

        service.basicInfoMsg = function(message, title) {
            var modalTemplate = '<div class="modal-header">';

            if (title)
                modalTemplate = modalTemplate + '<h3 class="modal-title">' + title + '</h3>';

            modalTemplate = modalTemplate + '</div>';
            modalTemplate = modalTemplate + '<div class="modal-body" style="height: 200px; overflow-y: auto;">';

            modalTemplate = modalTemplate + '<div>';
            modalTemplate = modalTemplate + '<p>' + message + '</p>';
            modalTemplate = modalTemplate + "</div>";

            modalTemplate = modalTemplate + '</div>';
            modalTemplate = modalTemplate + '<div class="modal-footer">';
            modalTemplate = modalTemplate + '<button class="btn btn-warning" ng-click="$dismiss()">OK</button>';
            modalTemplate = modalTemplate + '</div>';

            var modal = $uibModal.open({
				controller : 'ModalDialogCtrl',
                animation: 'true',
                backdrop: 'false',
                template: modalTemplate
            });
        };

        return service;
    }
})();
