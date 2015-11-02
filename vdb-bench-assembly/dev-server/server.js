var restify = require('restify');
var xmldom = require('xmldom');
var fs = require('fs');

var host = 'localhost';
var port = '3000';
var baseUrl = '/v1/workspace';
var xmlContentType = "application/xml";
var jsonContentType = "application/json";

// =============== START OF TEST DATA CONFIGURATION =============

function readJson(filename) {
    return JSON.parse(fs.readFileSync(__dirname + '/json/' + filename).toString());
}

function readXml(filename) {
    var xmlStr = fs.readFileSync(__dirname + '/xml/' + filename).toString();
    return new xmldom.DOMParser().parseFromString(xmlStr);
}

var PORTFOLIO = 'portfolio';
var PARTS = 'parts';
var TWEET = 'tweet';
var ALL_ELEMENTS = 'all-elements';
var ID = 'keng__id';
var MODELS = 'models';
var TRANSLATORS = 'translators';
var SOURCES = 'sources';
var IMPORTS = 'imports';
var DATA_ROLES = 'dataRoles';
var PERMISSIONS = 'permissions';
var CONDITIONS = 'conditions';
var MASKS = 'masks';
var LINKS = 'keng___links';
var SELF = 'self';
var PARENT = 'parent';
var REL = 'rel';
var HREF = 'href';

/*
 * Load default data
 */
var vdbs = {};
vdbs[PORTFOLIO] = readJson(PORTFOLIO + '.json');
vdbs[PARTS] = readJson(PARTS + '.json');
vdbs[TWEET] = readJson(TWEET + '.json');
vdbs[ALL_ELEMENTS] = readJson(ALL_ELEMENTS + '.json');

vdbs[PORTFOLIO].xml = readXml(PORTFOLIO + '.xml');
vdbs[PARTS].xml = readXml(PARTS + '.xml');
vdbs[TWEET].xml = readXml(TWEET + '.xml');
vdbs[ALL_ELEMENTS].xml = readXml(ALL_ELEMENTS + '.xml');

var jsonVdbSchema = readJson('vdb-xsd.json');

/**
 * Find the vdb with the given id
 */
function findVdb(vdbId) {
    console.log("Finding vdb with id " + vdbId);
    if (!vdbId)
        return null;

    console.log("Searching keys of vdb collection");
    for (var key in vdbs) {
        var vdb = vdbs[key];
        console.log("Getting vdb for key " + key);
        if (! vdb || ! vdb.digest)
            continue;

        var id = vdb.digest[ID];
        console.log("Checking vdb id " + id + " against " + vdbId);
        if (!id)
            continue;

        if (id == vdbId)
            return vdb;
    }

    return null;
}

/**
 * Find an object with the given id in the parent array
 */
function findObjectById(parentArr, id) {
    console.log("Finding object with id " + id);
    if (!parentArr || !id)
        return null;

    console.log("Searching indices of object array");
    for (var i = 0; i < parentArr.length; ++i) {
        var obj = parentArr[i];
        var objId = obj[ID];
        console.log("Checking object id " + objId + " against " + id);

        if (objId == id)
            return obj;
    }

    return null;
}

/**
 * Iterator the vdb object named 'childType' to find all the
 * children of the given parent
 */
function findChildren(parent, vdb, childType, childId, vdbId) {
    console.log("Finding children of type " + childType + " of parent " + parent[ID] + " with optional childId of " + childId);

    var parentSelfLink = findLink(parent, SELF);
    console.log("Self link of parent " + parentSelfLink);
    var children = [];
    
    for (var i = 0; i < vdb[childType].length; ++i) {
        var child = vdb[childType][i];
        console.log("Checking child " + child[ID] + " in vdb " + vdbId);
        
        var childParentLink = findLink(child, PARENT);
        console.log("Parent link of child " + childParentLink);
        
        if (parentSelfLink != childParentLink) {
            continue;
        }
        
        console.log("Comparing childId " + childId + " with " + child[ID]);
        if (childId == null || child[ID] == childId)
            children.push(child);
    }

    return children;
}

/**
 * Find the link with the given name in
 * the given object
 */
function findLink(obj, name) {
    if (!obj || !name)
        return null;

    if (! obj[LINKS])
        return null;

    for (var i = 0; i < obj[LINKS].length; ++i) {
        var link = obj[LINKS][i];
        if (link[REL] == name)
            return link[HREF];
    }

    return null;
}

/**
 * View the vdb metadata for id
 *
 * http://localhost:3000/api/v1/schema/Condition
 * http://localhost:3000/api/v1/schema?ktype=VDB_CONDITION
 */
function viewSchema(req, res, next) {
    console.log("Returning schema specification");

    var schemaId = req.params == null ? null : req.params.schemaId;
    var ktype = req.query == null ? null : req.query.ktype;

    if (schemaId != null) {
        console.log("Fetching schema config for id " + schemaId);

        var schema = jsonVdbSchema['schema-1'];
        var element = schema[schemaId];
        if (element == null) {
            res.send(404, { error: "No vdb schema for element named " + schemaId });
            return next();
        }

        console.log("Returning json schema for id " + schemaId);
        res.send(200, element);
        return next();
    }
    else if (ktype != null) {
        var schema = jsonVdbSchema['schema-1'];
        Object.keys(schema).forEach(
            function(key){
                var schObj = schema[key];
                if (ktype == schObj['keng__kType']) {
                    console.log("Fetching schema config for ktype query " + ktype);
                    element = schObj;
                }
            }
        );

        if (element == null) {
            res.send(404, { error: "No vdb schema for element with ktype " + ktype });
            return next();
        }

        console.log("Returning json schema for ktype " + ktype);
        res.send(200, element);
        return next();
    }
    else {
        // Return all of schema
        console.log(jsonVdbSchema['schema-1']);

        res.send(200, jsonVdbSchema['schema-1']);
        return next();
    }
}

/**
 * View the vdb metadata
 * application/json
 */
function viewVdbs(req, res, next) {
    console.log("Returning all vdbs");

    var acceptsJson = req.accepts(jsonContentType);

    /*
     * If request has the accept header only containing application/xml
     * (and not application/json) then respond with the xml version
     */
    if (!acceptsJson) {
        // Only acceptable formats for vdb content is xml or json
        // so return a 406 (Not Acceptable)
        console.log("Request has invalid Accept header: " + req.headers.accept + " (Only application/json is allowed)");
        res.send(406);
        return next();
    }

    /*
     * json format
     */
    var vdbDigests = [ vdbs[PORTFOLIO].digest, vdbs[PARTS].digest, vdbs[TWEET].digest, vdbs[ALL_ELEMENTS].digest];
    res.send(200, vdbDigests);
    return next();
}

/**
 * Delete the vdb using the parameters in the request
 */
function deleteVdb(req, res, next) {
    var vdbId = req.params.vdbId;
    console.log("Fetching vdb content for id " + vdbId);

    var vdb = findVdb(vdbId);
    if (vdb)
        console.log("Found vdb id " + vdbId);
    else {
        console.log("Failed to find vdb with id " + vdbId);
        res.send(404, { error: "No vdb named " + vdbId });
        return next();
    }

    var keyToDelete = null;
    for (var key in vdbs) {
        var vdb = vdbs[key];
        console.log("Getting vdb for key " + key);
        if (! vdb || ! vdb.digest)
            continue;

        var id = vdb.digest[ID];
        console.log("Checking vdb id " + id + " against " + vdbId);
        if (!id)
            continue;

        if (id == vdbId) {
            keyToDelete = key;
            break;
        }
    }

    if (keyToDelete) {
        delete vdbs[keyToDelete];
    }

    if (vdbs[keyToDelete])
        res.send(404, { error: "Failed to delete vdb with id " + vdbId });
    else
        res.send(200);

    return next();
}

/**
 * View a vdb
 * application/xml or application/json
 */
function viewVdb(req, res, next) {
    var vdbId = req.params.vdbId;
    console.log("Fetching vdb content for id " + vdbId);

    var vdb = findVdb(vdbId);
    if (vdb)
        console.log("Found vdb id " + vdbId);
    else {
        console.log("Failed to find vdb with id " + vdbId);
        res.send(404, { error: "No vdb named " + vdbId });
        return next();
    }

    console.log("Request Accept headers: " + req.headers.accept);

    /*
     * If request has the content type of application/xml
     * then respond with the xml version
     */
    if (req.accepts(xmlContentType)) {
        console.log("Returning xml content for id " + vdbId);

        var vdbNodes = vdb.xml.getElementsByTagName("vdb");
        console.log("Number of vdbs in xml content is " + vdbNodes.length);

        var body;
        var statusCode;
        if (vdbNodes.length == 0) {
            body = "<error message=\"No vdb content for vdb named " + vdbId + "\"></error>";
            statusCode = 404;
        } else {
            var xmlVdb = vdbNodes[0];
            console.log("Found xml vdb " + xmlVdb);

            body = new xmldom.XMLSerializer().serializeToString(xmlVdb);
            console.log("Sending back serialized xml body:\n" + body);
            statusCode = 200;
        }

        // Uses the raw methods of ServerResponse rather
        // than worrying about adding a formatter to Server
        res.setHeader('Content-Type', xmlContentType);
        res.writeHead(statusCode, {
            'Content-Length': Buffer.byteLength(body),
            'Content-Type': xmlContentType
        });
        res.write(body);
        res.end();
        return next();

    } else if (req.accepts(jsonContentType)) {
        /*
         * json format
         */
        console.log("Returning json content for id " + vdbId);
        res.send(200, vdb.digest);
        return next();
    }

    // Only acceptable formats for vdb content is xml or json
    // so return a 406 (Not Acceptable)
    console.log("Request has invalid Accept header: " + req.headers.accept + " (Only application/xml and application/json are allowed)");
    res.send(406);
    return next();
}

/**
 * View a vdb model
 */
function viewModels(req, res, next) {
    var vdbId = req.params == null ? null : req.params.vdbId;
    var modelId = req.params == null ? null : req.params.modelId;

    console.log("Viewing model for vdb id " + vdbId);
    console.log("Viewing model for model id " + modelId);

    var vdb = findVdb(vdbId);
    if (vdb)
        console.log("Found vdb id " + vdbId);
    else {
        console.log("Failed to find vdb with id " + vdbId);
        res.send(404, { error: "No vdb named " + vdbId });
        return next();
    }

    var models = vdb[MODELS];
    var returnId = 200;
    var returnObj = models;

    if (modelId) {
        var model = findObjectById(models, modelId);
        if (! model) {
            returnId = 404;
            returnObj = { error: "No model named " + modelId };
        } else {
            returnObj = model;
        }
    }

    res.send(returnId, returnObj);
    return next();
}

/**
 * View a vdb translator
 */
function viewTranslators(req, res, next) {
    var vdbId = req.params == null ? null : req.params.vdbId;
    var translatorId = req.params == null ? null : req.params.translatorId;

    console.log("Viewing translator for vdb id " + vdbId);
    console.log("Viewing translator for translator id " + translatorId);

    var vdb = findVdb(vdbId);
    if (vdb)
        console.log("Found vdb id " + vdbId);
    else {
        console.log("Failed to find vdb with id " + vdbId);
        res.send(404, { error: "No vdb named " + vdbId });
        return next();
    }

    var translators = vdb[TRANSLATORS];
    var returnId = 200;
    var returnObj = translators ? translators : [];

    if (translatorId) {
        var translator = findObjectById(translators, translatorId);
        if (! translator) {
            returnId = 404;
            returnObj = { error: "No translator named " + translatorId };
        } else {
            returnObj = translator;
        }
    }

    res.send(returnId, returnObj);
    return next();
}

/**
 * View a vdb model source
 */
function viewSources(req, res, next) {
    var vdbId = req.params == null ? null : req.params.vdbId;
    var modelId = req.params == null ? null : req.params.modelId;
    var sourceId = req.params == null ? null : req.params.sourceId;

    console.log("Viewing vdb for vdb id " + vdbId);
    console.log("Viewing model for model id " + modelId);
    console.log("Viewing source for source id " + sourceId);

    var vdb = findVdb(vdbId);
    if (vdb)
        console.log("Found vdb id " + vdbId);
    else {
        console.log("Failed to find vdb with id " + vdbId);
        res.send(404, { error: "No vdb named " + vdbId });
        return next();
    }

    var models = vdb[MODELS];
    var model = findObjectById(models, modelId);
    if (! model) {
        res.send(404, { error: "No model named " + modelId });
        return next();
    }

    var sources = findChildren(model, vdb, SOURCES, sourceId, vdbId);
    if (! sourceId) {
        res.send(200, sources);
        return next();    
    }

    if (sources.length == 0) {
        res.send(404, { error: "No source named " + sourceId });
        return next();
    }

    res.send(200, sources[0]);
    return next();
}

/**
 * View a vdb imports
 */
function viewImports(req, res, next) {
    var vdbId = req.params == null ? null : req.params.vdbId;
    var importId = req.params == null ? null : req.params.importId;

    console.log("Viewing import for vdb id " + vdbId);
    console.log("Viewing import for import id " + importId);

    var vdb = findVdb(vdbId);
    if (vdb)
        console.log("Found vdb id " + vdbId);
    else {
        console.log("Failed to find vdb with id " + vdbId);
        res.send(404, { error: "No vdb named " + vdbId });
        return next();
    }

    var imports = vdb[IMPORTS];
    var returnId = 200;
    var returnObj = imports ? imports : [];

    if (importId) {
        var vdbImport = findObjectById(imports, importId);
        if (! vdbImport) {
            returnId = 404;
            returnObj = { error: "No import named " + importId };
        } else {
            returnObj = vdbImport;
        }
    }

    res.send(returnId, returnObj);
    return next();
}

/**
 * View a vdb data role
 */
function viewDataRoles(req, res, next) {
    var vdbId = req.params == null ? null : req.params.vdbId;
    var dataRoleId = req.params == null ? null : req.params.dataRoleId;

    console.log("Viewing dataRole for vdb id " + vdbId);
    console.log("Viewing dataRole for dataRole id " + dataRoleId);

    var vdb = findVdb(vdbId);
    if (vdb)
        console.log("Found vdb id " + vdbId);
    else {
        console.log("Failed to find vdb with id " + vdbId);
        res.send(404, { error: "No vdb named " + vdbId });
        return next();
    }

    var dataRoles = vdb[DATA_ROLES];
    if (! dataRoleId) {
        res.send(200, dataRoles);
        return next();
    }

    var dataRole = findObjectById(dataRoles, dataRoleId);
    if (! dataRole) {
        res.send(404, { error: "No dataRole named " + dataRoleId });
        return next();
    }

    res.send(200, dataRole);
    return next();
}

/**
 * View a vdb data role permissions
 */
function viewPermissions(req, res, next) {
    var vdbId = req.params == null ? null : req.params.vdbId;
    var dataRoleId = req.params == null ? null : req.params.dataRoleId;
    var permissionId = req.params == null ? null : req.params.permissionId;

    console.log("Viewing dataRole for vdb id " + vdbId);
    console.log("Viewing dataRole for dataRole id " + dataRoleId);
    console.log("Viewing permission for permission id " + permissionId);

    var vdb = findVdb(vdbId);
    if (vdb)
        console.log("Found vdb id " + vdbId);
    else {
        console.log("Failed to find vdb with id " + vdbId);
        res.send(404, { error: "No vdb named " + vdbId });
        return next();
    }

    var dataRoles = vdb[DATA_ROLES];
    var dataRole = findObjectById(dataRoles, dataRoleId);
    if (! dataRole) {
        res.send(404, { error: "No dataRole named " + dataRoleId });
        return next();
    }

    var permissions = findChildren(dataRole, vdb, PERMISSIONS, permissionId, vdbId);
    if (! permissionId) {
        res.send(200, permissions);
        return next();    
    }

    if (permissions.length == 0) {
        res.send(404, { error: "No permission named " + permissionId });
        return next();
    }

    res.send(200, permissions[0]);
    return next();
}

/**
 * View a vdb data role permission conditions
 */
function viewConditions(req, res, next) {
    var vdbId = req.params == null ? null : req.params.vdbId;
    var dataRoleId = req.params == null ? null : req.params.dataRoleId;
    var permissionId = req.params == null ? null : req.params.permissionId;
    var conditionId = req.params == null ? null : req.params.conditionId;

    console.log("Viewing dataRole for vdb id " + vdbId);
    console.log("Viewing dataRole for dataRole id " + dataRoleId);
    console.log("Viewing permission for permission id " + permissionId);
    console.log("Viewing condition for condition id " + conditionId);

    var vdb = findVdb(vdbId);
    if (vdb)
        console.log("Found vdb id " + vdbId);
    else {
        console.log("Failed to find vdb with id " + vdbId);
        res.send(404, { error: "No vdb named " + vdbId });
        return next();
    }

    var dataRoles = vdb[DATA_ROLES];

    var dataRole = findObjectById(dataRoles, dataRoleId);
    if (! dataRole) {
        res.send(404, { error: "No dataRole named " + dataRoleId });
        return next();
    }

    var permissions = findChildren(dataRole, vdb, PERMISSIONS, permissionId, vdbId);
    if (permissions.length == 0) {
        res.send(404, { error: "No permission named " + permissionId });
        return next();
    }

    var conditions = findChildren(permissions[0], vdb, CONDITIONS, conditionId, vdbId);
    if (! conditionId) {
        res.send(200, conditions);
        return next();    
    }

    if (conditions.length == 0) {
        res.send(404, { error: "No condition named " + conditionId });
        return next();
    }

    res.send(200, conditions[0]);
    return next();
}

/**
 * View a vdb data role permission masks
 */
function viewMasks(req, res, next) {
    var vdbId = req.params == null ? null : req.params.vdbId;
    var dataRoleId = req.params == null ? null : req.params.dataRoleId;
    var permissionId = req.params == null ? null : req.params.permissionId;
    var maskId = req.params == null ? null : req.params.maskId;

    console.log("Viewing dataRole for vdb id " + vdbId);
    console.log("Viewing dataRole for dataRole id " + dataRoleId);
    console.log("Viewing permission for permission id " + permissionId);
    console.log("Viewing masks for masks id " + maskId);

    var vdb = findVdb(vdbId);
    if (vdb)
        console.log("Found vdb id " + vdbId);
    else {
        console.log("Failed to find vdb with id " + vdbId);
        res.send(404, { error: "No vdb named " + vdbId });
        return next();
    }

    var dataRoles = vdb[DATA_ROLES];

    var dataRole = findObjectById(dataRoles, dataRoleId);
    if (! dataRole) {
        res.send(404, { error: "No dataRole named " + dataRoleId });
        return next();
    }

    var permissions = findChildren(dataRole, vdb, PERMISSIONS, permissionId, vdbId);
    if (permissions.length == 0) {
        res.send(404, { error: "No permission named " + permissionId });
        return next();
    }

    var masks = findChildren(permissions[0], vdb, MASKS, maskId, vdbId);
    if (! maskId) {
        res.send(200, masks);
        return next();
    }

    if (masks.length == 0) {
        res.send(404, { error: "No masks named " + maskId });
        return next();
    }

    res.send(200, masks[0]);
    return next();
}

// =============== END OF TEST DATA CONFIGURATION =============

/*
 * Initialise Test Server
 */
var server = restify.createServer({
    name: "test-server"
});

/*
 * Configures plugin extensions of the server
 */
server.use(restify.fullResponse());
server.use(restify.queryParser());
server.use(restify.bodyParser());
//server.use(restify.CORS());

/*
 * Don't want this since we want to allow application/xml
 */
//server.use(restify.acceptParser(server.acceptable));

/*
 * Vdbs Resource
 */
server.get({ path: baseUrl + '/vdbs' }, viewVdbs);
server.get({ path: baseUrl + '/vdbs/:vdbId' }, viewVdb);
server.get({ path: baseUrl + '/vdbs/:vdbId/Models' }, viewModels);
server.get({ path: baseUrl + '/vdbs/:vdbId/Models/:modelId' }, viewModels);
server.get({ path: baseUrl + '/vdbs/:vdbId/Models/:modelId/VdbModelSources' }, viewSources);
server.get({ path: baseUrl + '/vdbs/:vdbId/Models/:modelId/VdbModelSources/:sourceId' }, viewSources);
server.get({ path: baseUrl + '/vdbs/:vdbId/VdbTranslators' }, viewTranslators);
server.get({ path: baseUrl + '/vdbs/:vdbId/VdbTranslators/:translatorId' }, viewTranslators);
server.get({ path: baseUrl + '/vdbs/:vdbId/VdbImports' }, viewImports);
server.get({ path: baseUrl + '/vdbs/:vdbId/VdbImports/:importId' }, viewImports);
server.get({ path: baseUrl + '/vdbs/:vdbId/VdbDataRoles' }, viewDataRoles);
server.get({ path: baseUrl + '/vdbs/:vdbId/VdbDataRoles/:dataRoleId' }, viewDataRoles);
server.get({ path: baseUrl + '/vdbs/:vdbId/VdbDataRoles/:dataRoleId/VdbPermissions' }, viewPermissions);
server.get({ path: baseUrl + '/vdbs/:vdbId/VdbDataRoles/:dataRoleId/VdbPermissions/:permissionId' }, viewPermissions);
server.get({ path: baseUrl + '/vdbs/:vdbId/VdbDataRoles/:dataRoleId/VdbPermissions/:permissionId/VdbConditions' }, viewConditions);
server.get({ path: baseUrl + '/vdbs/:vdbId/VdbDataRoles/:dataRoleId/VdbPermissions/:permissionId/VdbConditions/:conditionId' }, viewConditions);
server.get({ path: baseUrl + '/vdbs/:vdbId/VdbDataRoles/:dataRoleId/VdbPermissions/:permissionId/VdbMasks' }, viewMasks);
server.get({ path: baseUrl + '/vdbs/:vdbId/VdbDataRoles/:dataRoleId/VdbPermissions/:permissionId/VdbConditions/:maskId' }, viewMasks);

server.del({path : baseUrl + '/vdbs/:vdbId' }, deleteVdb);
//server.post({path : PATH , version: '0.0.1'} ,postNewJob);

/*
 * Vdb Schema Specification
 */
server.get({ path: baseUrl + '/schema' }, viewSchema);

/*
 * Start server listening
 */
server.listen(port, host, function () {
    console.log('%s listening at %s ', server.name, server.url);
});
