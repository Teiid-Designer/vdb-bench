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
var xmlVdbs = readXml('vdbs.xml');
var xmlVdbContent = readXml('vdbsContent.xml');

function viewVdbs(req, res, next) {
    console.log("Returning all vdbs");

    var acceptsJson = req.accepts(jsonContentType);
    var acceptsXml = req.accepts(xmlContentType);

    /*
     * If request has the accept header only containing application/xml
     * (and not application/json) then respond with the xml version
     */
    if (!acceptsJson && acceptsXml) {
        var body = new xmldom.XMLSerializer().serializeToString(xmlVdbs);

        // Uses the raw methods of ServerResponse rather
        // than worrying about adding a formatter to Server
        res.setHeader('Content-Type', 'application/xml');
        res.writeHead(200, {
            'Content-Length': Buffer.byteLength(body),
            'Content-Type': xmlContentType
        });
        res.write(body);
        res.end();
        return next();
    }

    /*
     * json format
     */
    res.send(200, jsonVdbs.vdbs);
    return next();
}

function indexVdbs(vdbId) {
    for (var i = 0; i < jsonVdbs.vdbs.length; ++i) {
        if (jsonVdbs.vdbs[i].id == vdbId)
            return i;
    }

    return -1;
}

function viewVdb(req, res, next) {
    var vdbId = req.params.vdbId;

    var index = indexVdbs(vdbId);
    if (index > -1 && index < jsonVdbs.vdbs.length) {
        res.send(200, jsonVdbs.vdbs[index]);
        return next();
    }

    res.send(404, { error: "No vdb named " + vdbId });
    return next();
}

function deleteVdb(req, res, next) {
    var vdbId = req.params.vdbId;

    var index = indexVdbs(vdbId);
    if (index == -1 || index >= jsonVdbs.vdbs.length) {
        res.send(404, { error: "No vdb named " + vdbId });
        return next();
    }

    // Check lengths of vdb data to ensure they were deleted
    var totalJsonVdbs = jsonVdbs.vdbs.length;
    var totalXmlVdbs = xmlVdbs.getElementsByTagName("vdb").length;

    jsonVdbs.vdbs.splice(index, 1);
    var xmlVdb = xmlVdbs.getElementsByTagName("vdb")[index];
    xmlVdbs.documentElement.removeChild(xmlVdb);

    if (totalJsonVdbs == jsonVdbs.vdbs.length || totalXmlVdbs == xmlVdbs.getElementsByTagName("vdb").length)
        res.send(404, { error: "Failed to delete vdb with id " + vdbId });
    else
        res.send(200);

    return next();
}

function indexVdbContents(vdbId) {
    for (var i = 0; i < jsonVdbContent.vdb.length; ++i) {
        if (jsonVdbContent.vdb[i].id == vdbId)
            return i;
    }

    return -1;
}

function viewVdbContent(req, res, next) {
    var vdbId = req.params.vdbId;
    console.log("Fetching vdb content for id " + vdbId);

    var index = indexVdbContents(vdbId);
    if (index == -1 || index >= jsonVdbContent.vdb.length) {
        res.send(404, { error: "No vdb content for vdb named " + vdbId });
        return next();
    }

    console.log("Found index of data for vdb id " + vdbId);

    /*
     * If request has the content type of application/xml
     * then respond with the xml version
     */
    if (req.accepts(xmlContentType)) {
        console.log("Returning xml content for id " + vdbId);

        var xmlVdb = xmlVdbs.getElementsByTagName("vdb")[index];
        var body = new xmldom.XMLSerializer().serializeToString(xmlVdb);

        // Uses the raw methods of ServerResponse rather
        // than worrying about adding a formatter to Server
        res.setHeader('Content-Type', xmlContentType);
        res.writeHead(200, {
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
server.get({ path: baseUrl + '/vdbs/:vdbId' }, viewVdb);
//server.post({path : PATH , version: '0.0.1'} ,postNewJob);
server.del({path : baseUrl + '/vdbs/:vdbId' }, deleteVdb);

/*
 * Vdb Content Resource
 */
server.get({ path: baseUrl + '/vdb/:vdbId' }, viewVdbContent);
//server.post({path : PATH , version: '0.0.1'} ,postNewJob);


/*
 * Start server listening
 */
server.listen(port, host, function () {
    console.log('%s listening at %s ', server.name, server.url);
});
