(function () {
    'use strict';

    angular
        .module('vdb-bench.core')

        // Global configuration properties
        .constant('CONFIG', {
            pluginDir: 'plugins',
            contentDir: 'content',
            imagesDir: 'img',
            rest: {
                protocol: 'https',
                port: 8443,
                baseUrl: '/vdb-builder/v1',
                authTypes: [
                    'basic', 'keycloak'
                ]
            },
            keycloak: {
                sessionNode: 'dsb-auth',
                clientId: 'ds-builder',
                role: 'ds-builder-access'
            },
            help: {
                baseUrl: '/ds-builder-help'
            }
        })

        .constant('SYNTAX', {
            EMPTY_STRING: '',
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
            AMPERSAND: '&',
            NEWLINE: '\n',
            HASH: '#',
            QMARK: '?',
            QUOTE: '\'',
            SEMI_COLON: ';',
            SPEECH_MARKS: '"',
            HTML: 'html',
            UNKNOWN: 'unknown'
        })

        .constant('JOIN', {
            INNER: 'INNER',
            FULL_OUTER: 'FULL_OUTER',
            LEFT_OUTER: 'LEFT_OUTER',
            RIGHT_OUTER: 'RIGHT_OUTER'
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
            TRANSLATOR_DEFAULT: '/TranslatorDefault',
            TRANSLATORS: '/VdbTranslators',
            TABLES: '/Tables',
            COLUMNS: '/Columns',
            JDBC_CATALOG_SCHEMA: '/JdbcCatalogSchema',
            CRITERIA_FOR_JOIN_TABLES: 'CriteriaForJoinTables',
            SERVICE_VDB_FOR_SINGLE_TABLE: 'ServiceVdbForSingleTable',
            SERVICE_VDB_FOR_JOIN_TABLES: 'ServiceVdbForJoinTables',
            SERVICE_VIEW_DDL_FOR_SINGLE_TABLE: 'ServiceViewDdlForSingleTable',
            SERVICE_VIEW_DDL_FOR_JOIN_TABLES: 'ServiceViewDdlForJoinTables',
            SERVICE_VIEW_INFO: 'serviceViewInfo',
            SOURCE_VDB_MATCHES: 'sourceVdbMatches',
            MODEL_FROM_TEIID_DDL: 'ModelFromTeiidDdl',
            DATA_SERVICES_CLONE: '/dataservices/clone',
            DATA_SERVICE: '/dataservice',
            DATA_SERVICES: '/dataservices',
            CONNECTIONS_CLONE: '/connections/clone',
            CONNECTION: '/connection',
            CONNECTIONS: '/connections',
            VDBS_CLONE: '/vdbs/clone',
            VDBS_FROM_TEIID: 'VdbsFromTeiid',
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
            NAME_VALIDATION: '/nameValidation',

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
