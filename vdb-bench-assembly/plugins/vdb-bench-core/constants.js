(function () {
    'use strict';

    angular
        .module('vdb-bench.core')

        // Global configuration properties
        .constant('CONFIG', {
            appTitle: 'Vdb-Bench',
            version: '0.0.1',
            restScheme: 'https', // The protocol used to serve the REST API
            restPort: 8443, // The port used to serve the REST API
            baseRestUrl: '/vdb-builder/v1',
            baseUrl: '/vdb-bench',
            pluginDir: 'plugins',
            contentDir: 'content',
            imagesDir: 'img'
        })

        .constant('SYNTAX', {
            FORWARD_SLASH: '/',
            OPEN_BRACKET: '(',
            CLOSE_BRACKET: ')',
            OPEN_BRACE: '{',
            CLOSE_BRACE: '}',
            OPEN_SQUARE_BRACKET: '[',
            CLOSE_SQUARE_BRACKET: ']',
            COMMA: ',',
            COLON: ':',
            HYPHEN: '-',
            UNDERSCORE: '_',
            SPACE: ' ',
            DOT: '.',
            STAR: '*',
            NEWLINE: '\n',
            HASH: '#',
            SPEECH_MARKS: '"',
            HTML: 'html',
            UNKNOWN: 'unknown'
        })

        .constant('REST_URI', {
            BASE_URL: '/v1',
            WORKSPACE: '/workspace',
            VDB: '/vdb',
            VDBS: '/vdbs',
            SERVICE: '/service',
            ABOUT: '/about',
            SCHEMA: '/schema',
            SEARCH: '/search',
            TEIID: '/teiid',
            TRANSLATORS: '/VdbTranslators',
            DATA_SERVICES_CLONE: '/dataservices/clone',
            DATA_SERVICE: '/dataservice',
            DATA_SERVICES: '/dataservices',
            DATA_SOURCES_CLONE: '/datasources/clone',
            DATA_SOURCE: '/datasource',
            DATA_SOURCES: '/datasources',
            VDBS_CLONE: '/vdbs/clone',
            COPY_TO_REPO: 'copyToRepo',
            DRIVER: '/driver',
            DRIVERS: '/drivers',
            MODEL: '/Model',
            MODELS: '/Models',
            MODEL_SOURCES: '/VdbModelSources',
            SAVE_SEARCH: 'saveSearch',
            SAVED_SEARCHES: '/savedSearches',
            SEARCH_CONTAINS: 'contains',
            SEARCH_TYPE: 'type',
            SEARCH_PATH: 'path',
            SEARCH_PARENT: 'parent',
            SEARCH_OBJECT_NAME: 'objectName',
            SEARCH_SAVE_NAME: 'searchName',
            SEARCH_PARAMETERS: 'parameters',
            DATA_KOMODO: 'tko:komodo',
            DATA_WORKSPACE: 'tko:workspace',
            STATUS: '/status',
            IMPORT_EXPORT: '/importexport',
            AVAILABLE_STORAGE_TYPES: '/availableStorageTypes',
            EXPORT: '/export',
            IMPORT: '/import',
            QUERY: '/query',
            CREDENTIALS: '/credentials',
            PING: '/ping',

            //
            // Types used for whether a teiid vdb
            // is being requested or a workspace
            // vdb. Likewise, for translators
            //
            TEIID_SERVICE: 'teiid',
            WKSP_SERVICE: 'workspace'
        })

        .constant('DATASERVICE_KEYS', {
            DATA_SERVICES: 'dataservices',
            ID: 'keng__id',
            DATA_PATH: 'keng__dataPath',
            DESCRIPTION: 'keng__description',
            TYPE: 'keng__kType',
            LINKS: {
                ID: 'keng___links',
                NAME: 'rel',
                HREF: 'href',
                SELF: 'self',
                PARENT: 'parent',
                CHILDREN: 'children',
                IMPORTS: 'imports',
                MODELS: 'models',
                TRANSLATORS: 'translators',
                DATA_ROLES: 'dataRoles',
                SOURCES: 'sources'
            },
            PROPERTIES: 'keng__properties',
            DDL: 'keng__ddl',
            HAS_CHILDREN: 'keng__hasChildren'
        })

        .constant('VDB_KEYS', {
            VDBS: 'vdbs',
            ID: 'keng__id',
            DATA_PATH: 'keng__dataPath',
            DESCRIPTION: 'keng__description',
            TYPE: 'keng__kType',
            LINKS: {
                ID: 'keng___links',
                NAME: 'rel',
                HREF: 'href',
                SELF: 'self',
                PARENT: 'parent',
                CHILDREN: 'children',
                IMPORTS: 'imports',
                MODELS: 'models',
                TRANSLATORS: 'translators',
                DATA_ROLES: 'dataRoles',
                SOURCES: 'sources'
            },
            PROPERTIES: 'keng__properties',
            DDL: 'keng__ddl',
            HAS_CHILDREN: 'keng__hasChildren'
        })

        .constant('VDB_SCHEMA', {
            SCHEMA: 'schema',
            ID: 'keng__id',
            DESCRIPTION: 'keng__description',
            K_TYPE: 'keng__kType',
            VALUE_TYPE: 'keng__type',
            REQUIRED: 'keng__required',
            REPEATABLE: 'keng__repeatable',
            LIMIT: 'keng__limit',
            PROPERTIES: 'keng__properties',
            CHILDREN: 'keng__children',
            SCHEMA_PROPERTY: 'property',
            SCHEMA_NAME: 'name',
            SCHEMA_VALUE: 'value',
            SUGGESTED_VALUES: 'keng__values',
            DESCRIPTION_PROPERTY: 'vdb__description'
        });

})();
