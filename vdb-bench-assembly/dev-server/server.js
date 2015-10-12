var restify = require('restify');
var xmldom = require('xmldom');
var fs = require('fs');

var host = 'localhost';
var port = '3000';
var baseUrl = '/api/v1';
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

/*
 * Load default data
 */
var jsonVdbs = readJson('vdbs.json');
var jsonVdbContent = readJson('vdbsContent.json');
var xmlVdbContentDoc = readXml('vdbsContent.xml');
var jsonVdbSchema = readJson('vdb-xsd.json');

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
                if (ktype == schObj['keng-kType']) {
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
    res.send(200, jsonVdbs.vdbs);
    return next();
}

/**
 * Get the index of the vdb with given id from json collection
 */
function indexVdbs(vdbId) {
    for (var i = 0; i < jsonVdbs.vdbs.length; ++i) {
        if (jsonVdbs.vdbs[i].id == vdbId)
            return i;
    }

    return -1;
}

/**
 * Delete the vdb using the parameters in the request
 */
function deleteVdb(req, res, next) {
    var vdbId = req.params.vdbId;

    var index = indexVdbs(vdbId);
    if (index == -1 || index >= jsonVdbs.vdbs.length) {
        res.send(404, { error: "No vdb named " + vdbId });
        return next();
    }

    // Check lengths of vdb data to ensure they were deleted
    var totalJsonVdbs = jsonVdbs.vdbs.length;

    jsonVdbs.vdbs.splice(index, 1);

    // Remove the content of the vdb as well as the metadata
    // ... from json
    jsonVdbContent.vdb.splice(index, 1)
    // ... from xml
    var xmlVdb = xmlVdbContentDoc.getElementsByTagName("vdb")[index];
    xmlVdbContentDoc.documentElement.removeChild(xmlVdb);

    if (totalJsonVdbs == jsonVdbs.vdbs.length)
        res.send(404, { error: "Failed to delete vdb with id " + vdbId });
    else
        res.send(200);

    return next();
}

/**
 * Get the index of the vdb with the given id from the json vdb content collection
 */
function indexVdbContents(vdbId) {
    for (var i = 0; i < jsonVdbContent.vdb.length; ++i) {
        if (jsonVdbContent.vdb[i].id == vdbId)
            return i;
    }

    return -1;
}

/**
 * View the vdb content
 * application/xml or application/json
 */
function viewVdbContent(req, res, next) {
    var vdbId = req.params.vdbId;
    console.log("Fetching vdb content for id " + vdbId);

    var index = indexVdbContents(vdbId);
    console.log("Found index " + index + " of data for vdb id " + vdbId);

    /*
     * If request has the content type of application/xml
     * then respond with the xml version
     */
    if (req.accepts(xmlContentType)) {
        console.log("Returning xml content for id " + vdbId);

        var vdbNodes = xmlVdbContentDoc.getElementsByTagName("vdb");
        console.log("Number of vdbs in xml content is " + vdbNodes.length);

        var body;
        var statusCode;
        if (index == -1 || index >=  vdbNodes.length) {
            body = "<error message=\"No vdb content for vdb named " + vdbId + "\"></error>";
            statusCode = 404;
        } else {
            var xmlVdb = vdbNodes[index];
            console.log("Found xml vdb at index : " + index + " - " + xmlVdb);

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
        if (index == -1 || index >= jsonVdbContent.vdb.length) {
            res.send(404, { error: "No vdb content for vdb named " + vdbId });
            return next();
        }

        /*
         * json format
         */
        console.log("Returning json content for id " + vdbId);
        res.send(200, jsonVdbContent.vdb[index]);
        return next();
    }

    // Only acceptable formats for vdb content is xml or json
    // so return a 406 (Not Acceptable)
    console.log("Request has invalid Accept header: " + req.headers.accept + " (Only application/xml and application/json are allowed)");
    res.send(406);
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
//server.post({path : PATH , version: '0.0.1'} ,postNewJob);
server.del({path : baseUrl + '/vdbs/:vdbId' }, deleteVdb);

/*
 * Vdb Content Resource
 */
server.get({ path: baseUrl + '/vdb/:vdbId' }, viewVdbContent);
//server.post({path : PATH , version: '0.0.1'} ,postNewJob);

/*
 * Vdb Schema Specification
 */
server.get({ path: baseUrl + '/schema' }, viewSchema);
server.get({ path: baseUrl + '/schema/:schemaId' }, viewSchema);

/*
 * Start server listening
 */
server.listen(port, host, function () {
    console.log('%s listening at %s ', server.name, server.url);
});
