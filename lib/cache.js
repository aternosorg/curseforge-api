const redis = require('redis');
const config = require('../config');

let redisclient = null;
if(config.rediscache){
    redisclient = redis.createClient(config.redis);
}

let memoryCache = {};

/**
 * Cache middleware function
 *
 * @param req
 * @param res
 * @param next
 * @returns {Promise<void>}
 */
async function middleware(req, res, next){
    const key = req.headers.host + (req.originalUrl || req.url);

    res.on('finish',async function(){
        if(res.isCached){
            return;
        }
        let cacheObj = {
            headers: res.getHeaders() || {},
            body: res.rawbody || '',
            status: res.statusCode
        };
        await set(key, JSON.stringify(cacheObj), res.isSuccess() ? config.cache.success : config.cache.error);
    });

    let cachedResponse = await get(key);
    if(!cachedResponse){
        saveRespBody(res);
        res.isCached = false;
        next();
        return;
    }
    try{
        cachedResponse = JSON.parse(cachedResponse);
    }catch (e) {
        saveRespBody(res);
        res.isCached = false;
        next();
        return;
    }
    res.isCached = true;
    res.status(cachedResponse.status || 200);
    res.set(cachedResponse.headers || {});
    res.send(cachedResponse.body);
}

/**
 * Overwrite write and end function of Response object
 * Save all sent data as string in Response.rawbody
 *
 * @param res
 */
function saveRespBody(res) {
    const origWrite = res.write;
    const origEnd = res.end;
    res.rawbody = '';

    res.write = function(...args){
        res.rawbody += String(args[0] || '');
        origWrite.apply(res,args);
    };
    res.end = function(...args){
        res.rawbody += String(args[0] || '');
        origEnd.apply(res,args);
    }
}

/**
 * Set value in cache
 *
 * @param key
 * @param value
 * @param duration
 * @returns {Promise<void>}
 */
function set(key, value, duration = 1000*60*60){
    return new Promise(function (resolve, reject) {
        if(redisclient){
            redisclient.hset(key, "response", value, function (err) {
                if(err){
                    return reject(err);
                }
                redisclient.hset(key, "duration", duration, function (err) {
                    if(err){
                        return reject(err);
                    }
                    redisclient.expire(key, duration/1000, function (err) {
                        if(err){
                            return reject(err);
                        }
                        resolve();
                    });
                });
            });
        }else{
            memoryCache[key] = {
                value: value,
                expires: Date.now() + duration
            };
            resolve();
        }
    });
}

/**
 * Get value from cache
 *
 * @param key
 * @returns {Promise<string|*>}
 */
function get(key) {
    return new Promise(function (resolve) {
        if(redisclient){
            redisclient.hgetall(key, function (err, obj) {
                if(err || !obj){
                    return resolve(null);
                }
                resolve(obj.response);
            });
        }else {
            if(!memoryCache[key] || Date.now() > memoryCache[key].expires){
                return resolve(null);
            }
            resolve(memoryCache[key].value);
        }
    });
}

module.exports = {
    middleware,
    set,
    get
};
