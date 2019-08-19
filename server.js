let cheerio = require('cheerio');
let express = require('express');
let config = require('./config.json');
const http = require('http');
const https = require('https');
const fsModule = require('fs');
const fs = fsModule.promises;
const gotModule = require('got');
const Timer = require('./lib/timer');
const cache = require('./lib/cache');
const helper = require("./lib/helper");
const gelf = require('gelf-pro');
const os = require('os');
const timeout = 10000;
let app = express();

if(config.graylog.enabled){
    gelf.setConfig({
        fields: {application: "curseforge-api", host: os.hostname()},
        adapterOptions: {
            host: config.graylog.host,
            port: config.graylog.port
        }
    });
}

const got = gotModule.extend({
    timeout: timeout,
    headers: {
        'user-agent': config.userAgent || 'curseforge-api/1.0.0'
    },
    hooks: {
        init: function(gotReq){
            console.log("FETCHING: " + gotReq.href);
            if(config.graylog.enabled){
                gelf.info(`FETCHING: ${gotReq.href}`, {
                    url: gotReq.href,
                    path: gotReq.pathname,
                    query: gotReq.query
                });
            }
        }
    }
});

app.use(function (req, res, next) {
    if(req.url !== '' && req.url !== '/'){
        res.set('Content-Type', 'application/json');
    }

    req.timers = new Timer();
    req.timers.start('total');
    res.on('finish',function(){
        req.timers.stop('total');
        console.log(req.timers.getMessage(req.url));
        if(config.graylog.enabled){
            gelf.info(`FINISH REQUEST: ${req.url}`, {
                total: req.timers.time('total')
            });
        }
    });

    /**
     * Send JSON error response
     *
     * @param error
     */
    res.serverError = function(error = null){
        let code = 500;
        if(error.name === 'HTTPError'){
            code = error.statusCode || 500;
            error = error.statusMessage || error.getMessage || null;
        }else if(error instanceof Error){
            error = error.message;
        }
        res.status(code);
        res.json({
            error: error || null,
            code: code
        });
    };

    /**
     * Send custom JSON error response
     *
     * @param code
     * @param error
     */
    res.httpError = function(code = 500, error = null){
        if(typeof code === 'object'){
            code = helper.getStatusCode(code);
        }
        res.status(code);
        res.json({
            error: error,
            code: code
        });
    };

    res.isSuccess = function(){
        return res.statusCode && ((res.statusCode >= 200 && res.statusCode < 300) || res.statusCode === 405);
    };
    next();
});

app.use(function (req, res, next) {
    let ip = req.get("x-forwarded-for") || req.ip;

    console.log("REQUESTED: " + req.url + " | " + ip + " | " + req.get("User-Agent"));
    next();
});

app.get("/", function (req, res) {
    res.sendFile(__dirname + '/views/index.html', {headers: {"content-type": "text/html"}});
});

if (config.caching) {
    app.use(cache.middleware);
}

let methods = [];
(async function(){
    for(let methodName of await fs.readdir('./methods')){
        let method = new (require('./methods/' + methodName))(config, cache, got, cheerio);
        method.register(app);
        methods.push(method);
    }
    app.use(function (req, res) {
        res.httpError(404, 'Not found')
    });
})();

let ssl = false, cert, key;
if(config.ssl){
    try{
        cert = fsModule.readFileSync(config.ssl.cert, 'utf8');
        key = fsModule.readFileSync(config.ssl.key, 'utf8');
        ssl = true;
    }catch(e){
        console.log('Could not read ssl cert or key');
        ssl = false;
    }
}

if(ssl){
    https.createServer({cert: cert, key: key}, app)
        .listen(config.port, function () {
            console.log('HTTPS server listening on port ' + config.port);
        });
}else{
    http.createServer(app)
        .listen(config.port, function () {
            console.log('HTTP server listening on port ' + config.port);
        });
}
