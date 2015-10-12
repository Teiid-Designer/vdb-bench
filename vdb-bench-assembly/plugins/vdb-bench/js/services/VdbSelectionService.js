/**
 * Vdb Selection Service
 *
 * Provides access to the selected vdb and its contents
 */
var vdbBench = (function(vdbBench) {

    vdbBench._module.factory('VdbSelectionService', [
             'RepoRestService',
             '$rootScope',
             '$filter',
             function(RepoRestService, $rootScope, $filter) {

                var LINKS = "_links";

                var selectedVdb;

                 /**
                  * Index of all the contents of the vdb
                  * indexed according to their self link
                  */
                var vdbIndex = {};

                /**
                 * Recurse the data object and map it to the index
                 * both being required for a tree layout
                 */
                function indexInternal(dataObject, dataIndex) {
                     var selfLink;

                     for (var key in dataObject) {
                         console.log("KEY: " + key);
                         var value = dataObject[key];

                         if (key == LINKS) {
                             selfLink = value[0].href;
                             console.log("Self Link: " + selfLink);
                             dataIndex[selfLink] = dataObject;
                         } else if (typeof(value) == 'object') {
                             console.log("Object: " + value);
                             indexInternal(value, dataIndex);
                         }
                     }
                }

                /**
                 * Index the Vdb contents by link to make it easy to search
                 * the vdb for a specific component
                 */
                function indexVdb() {
                    vdbIndex = {};

                    if (selectedVdb == null)
                        return;

                    indexInternal(selectedVdb, vdbIndex);
                    console.log(vdbIndex);
                }

                /*
                 * Service instance to be returned
                 */
                var service = {};

                /*
                 * Service : get selected vdb
                 */
                service.selected = function() {
                    return selectedVdb;
                };

                /*
                 * Service : set selected vdb
                 */
                service.setSelected = function(selected) {
                    
                    // Set selected to the selected repository
                    selectedVdb = selected;

                    // Index the compoments of the vdb
                    indexVdb();

                    // Useful for broadcasting the selected repository has been
                    // updated
                    $rootScope.$broadcast("selectedVdbChanged");
                };

                /*
                 * Service : is a vdb selected
                 */
                service.isVdbSelected = function() {
                    return ! _.isEmpty(selectedVdb);
                };

                /**
                 * Retrieve the contents of the vdb (in json)
                 */
                service.selectedContent = function () {
                    if (selectedVdb == null)
                        return null;

                    if (selectedVdb.content != null)
                        return selectedVdb.content;

                    try {
                        RepoRestService.getVdbContent(selectedVdb).then(
                            function (content) {
                                selectedVdb.content = content;
                            },
                            function (response) {
                                throw new vdbBench.RestServiceException("Failed to retrieve the content of the vdb " + selectedVdb.id + "from the host services.\n" + response.message);
                            });
                    } catch (error) {
                        throw new vdbBench.RestServiceException("Failed to retrieve the content of the selected vdb from the host services.\n" + error.message);
                    }
                };

                /**
                 * Retrieve the vdb xml for the selected vdb
                 */
                service.selectedXml = function () {
                    console.log("SelectedXML callled");
                    if (selectedVdb == null)
                        return;

                    try {                        
                        selectedVdb.previewContent = "Loading ...";

                        RepoRestService.getVdbXml(selectedVdb).then(
                            function (xml) {
                                selectedVdb.previewContent = $filter('prettyXml')(xml);
                            },
                            function (response) {
                                selectedVdb.previewContent = "Error occurred: ", response.message;
                            });
                    } catch (error) {
                        selectedVdb.previewContent = "Error occurred: " + error.message;
                    }
                };

                return service;
            } ]);

    return vdbBench;

})(vdbBench || {});
