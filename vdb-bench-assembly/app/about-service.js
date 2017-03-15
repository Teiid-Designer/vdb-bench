var VdbBenchApp = (function(App) {
    'use strict';

    App._module.factory('AboutService', AboutService);
    AboutService.$inject = ['$http', '$location'];

    function AboutService($http, $location) {
        /*
         * Service instance to be returned
         */
        var service = {};

        service.getAbout = function() {
            var baseUrl = $location.protocol() + '://' + $location.host() + ':' + $location.port() + '/';

            var absUrl = $location.absUrl();
            var url = absUrl.replace(baseUrl, "");
            var firstSlash = url.indexOf('/');
            var context;
            if (firstSlash >= 0)
                context = url.substring(0, firstSlash);
            else
                context = url;

            url = baseUrl + context + '/about.xml';
            return $http.get(url)
                .then(function(response) {
                    return response.data;
                }, function(response) {
                    return response;
                });
        };

        return service;
    }

    return App;

})(VdbBenchApp || (VdbBenchApp = {}));
