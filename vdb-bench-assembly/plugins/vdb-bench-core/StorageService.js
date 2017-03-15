/**
 * Local Storage Service
 * Convenience service to front $window.localStorage * from local storage
 * and the active (selected) repository.
 */
(function () {

    'use strict';

    angular
        .module('vdb-bench.core')
        .factory('StorageService', StorageService);

    StorageService.$inject = ['$window'];

    function StorageService($window) {
        var service = {
            set: function (key, value) {
                if (_.isEmpty(value))
                    delete $window.localStorage[key];
                else
                    $window.localStorage[key] = value;
            },

            get: function (key, defaultValue) {
                return $window.localStorage[key] || defaultValue;
            },

            setObject: function (key, value) {
                if (_.isEmpty(value))
                    delete $window.localStorage[key];
                else {
                    var jsonValue = JSON.stringify(value);
                    $window.localStorage[key] = JSON.stringify(value);
                }
            },

            getObject: function (key, defaultValue) {
                var value = $window.localStorage[key];
                if (!value)
                    return defaultValue;

                var valueObj = JSON.parse(value);
                return valueObj;
            },

            sessionSet: function (key, value) {
                if (_.isEmpty(value))
                    delete $window.sessionStorage[key];
                else
                    $window.sessionStorage[key] = value;
            },

            sessionGet: function (key, defaultValue) {
                return $window.sessionStorage[key] || defaultValue;
            },

            sessionSetObject: function (key, value) {
                if (_.isEmpty(value))
                    delete $window.sessionStorage[key];
                else {
                    var jsonValue = JSON.stringify(value);
                    $window.sessionStorage[key] = JSON.stringify(value);
                }
            },

            sessionGetObject: function (key, defaultValue) {
                var value = $window.sessionStorage[key];
                if (!value)
                    return defaultValue;

                var valueObj = JSON.parse(value);
                return valueObj;
            }
        };

        return service;
    }
})();
