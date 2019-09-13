/**
 * Class representing an API method
 *
 * @abstract
 */
class Method{
    /**
     * Method constructor
     *
     * @param config
     * @param cache
     * @param got
     * @param cheerio
     */
    constructor(config, cache, got = null, cheerio = null){
        this.config = config;
        this.gotModule = got || require('got');
        this.cheerio = cheerio || require('cheerio');
        this.cache = cache;
    }

    async httpReq(url, options = {}){
        if(options.cacheable !== false){
            let cached = await this.cache.get(`got-req-${url}`);
            if(cached){
                let response = JSON.parse(cached);
                if(response.statusCode !== 200){
                    throw new this.gotModule.HTTPError(response, options);
                }
                return response.body;
            }
        }
        let response = await this.gotModule(url, Object.assign({}, options, {
            throwHttpErrors: false
        }));
        if(options.cacheable !== false){
            await this.cache.set(`got-req-${url}`, JSON.stringify({
                statusCode: response.statusCode,
                body: response.body
            }), response.statusCode === 200 ? this.config.cache.success : this.config.cache.error);
        }
        if(response.statusCode !== 200){
            throw new this.gotModule.HTTPError(response, options);
        }
        return response.body;
    }

    /**
     * Register method route in express app
     *
     * @param app
     */
    register(app){
        const self = this;
        app.get(this.route,async function(req, res, next){
            if(!self.condition(req,res)){
                return next();
            }
            try{
                await self.call(req, res);
            }catch(e){
                res.serverError(e);
                console.error(e.stack || e);
            }
        });
    }

    /**
     * Additional condition for this method to be executed
     *
     * @param req
     * @param res
     * @returns {boolean}
     */
    condition(req,res){
        return true;
    }

    /**
     * Method express route
     *
     * @abstract
     * @returns {string}
     */
    get route(){
        return '';
    }

    /**
     * Execute method, write response
     * Content-Type is set to application/json by default
     *
     * @abstract
     * @param req
     * @param res
     * @returns {Promise<void>}
     */
    async call(req, res){
        res.serverError('not implemented');
    }
}

module.exports = Method;
