/**
 * Download (Export) Service
 *
 * Provides simple API for downloading content from the engine
 * and inviting the user to save it to their client filesystem.
 */
(function () {

    'use strict';

    angular
        .module('vdb-bench.core')
        .factory('DownloadService', DownloadService);

    DownloadService.$inject = ['SYNTAX', 'REST_URI', 'VDB_SCHEMA', 'VDB_KEYS',
                                              'RepoRestService', 'FileSaver', 'Blob', '$base64'];

    function DownloadService(SYNTAX, REST_URI, VDB_SCHEMA, VDB_KEYS,
                                            RepoRestService, FileSaver, Blob, $base64) {

        /*
         * Service instance to be returned
         */
        var service = {};

        /*
         * Converts a base64 data string into a blob for use with the FileSaver library
         * Acknowledgement to
         * http://stackoverflow.com/questions/16245767/creating-a-blob-from-a-base64-string-in-javascript
         */
        function b64toBlob(b64Data, contentType, sliceSize) {
            contentType = contentType || '';
            sliceSize = sliceSize || 512;

            //
            // Decodes the base64 string back into binary data byte characters
            //
            var byteCharacters = $base64.decode(b64Data);
            var byteArrays = [];

            //
            // Each character's code point (charCode) will be the value of the byte.
            // Can create an array of byte values by applying this using the .charCodeAt
            // method for each character in the string.
            //
            // The performance can be improved a little by processing the byteCharacters
            // in smaller slices, rather than all at once. Rough testing indicates 512 bytes
            // seems to be a good slice size.
            //
            for (var offset = 0; offset < byteCharacters.length; offset += sliceSize) {
                var slice = byteCharacters.slice(offset, offset + sliceSize);

                var byteNumbers = new Array(slice.length);
                for (var i = 0; i < slice.length; i++) {
                    byteNumbers[i] = slice.charCodeAt(i);
                }

                //
                // Convert the array of byte values into a real typed byte array
                // by passing it to the Uint8Array constructor.
                //
                var byteArray = new Uint8Array(byteNumbers);

                byteArrays.push(byteArray);
            }

            //
            // Convert to a Blob by wrapping it in an array passing it to the Blob constructor.
            //
            var blob = new Blob(byteArrays, {
                type: contentType
            });
            return blob;
        }

        /**
         * Service: download the given content from the rest service
         *              and offer it as a file to be saved.
         */
        service.download = function (dwnldableObj) {
            if (! dwnldableObj)
                return;

            try {
                RepoRestService.download(dwnldableObj).then(
                    function (exportStatus) {
                        if (! exportStatus.downloadable)
                            return;

                        if (! exportStatus.content)
                            return;

                        var name = exportStatus.name || dwnldableObj.keng__id;
                        var fileType = exportStatus.type || 'data';
                        var enc = exportStatus.content;

                        var contentType = fileType === "zip" ? 'application/zip' : 'text/plain;charset=utf-8';                        
                        var dataBlob = b64toBlob(enc, contentType);

                        FileSaver.saveAs(dataBlob, name + SYNTAX.DOT + fileType);
                    },
                    function (response) {
                        throw new RepoRestService.newRestException("Failed to export the artifact ");
                    });
            } catch (error) {} finally {
            }            
        };

        return service;
    }

})();
