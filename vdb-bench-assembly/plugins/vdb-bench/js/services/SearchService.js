/**
 * Search Service
 * Keyword search the repository and return all relevant artefacts
 */
var vdbBench = (function (vdbBench) {
    vdbBench._module.factory('SearchService', [
            'SYNTAX',
            'RepoRestService',
            function (SYNTAX, RepoRestService) {

                /*
                 * Service instance to be returned
                 */
                var service = {};

                // The array that will contain search results
                service.arrSearchResults = [];

                // The search term (for decoration)
                service.searchTerm = "";

                // Control if user searched recently
                service.userSearched = false;

                // Clear the search
                service.clearSearch = function () {
                    service.searchTerm = '';
                    service.arrSearchResults = [];
                    service.userSearched = false;
                };

                // Search function
                service.submitSearch = function (searchTerm) {
                    service.searchTerm = searchTerm;
                    console.log("Making search request using term " + service.searchTerm);
                }

                return service;
            } ]);

    return vdbBench;

})(vdbBench || {});