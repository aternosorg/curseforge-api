const Method = require('../lib/method');
const helper = require("../lib/helper");

class SearchMethod extends Method {
    get route() {
        return '/:game/:type/search';
    }

    async call(req, res) {
        const game = req.params.game;
        const type = req.params.type;
        const search = req.query.search || '';

        const url = `${this.config.baseUrl}${game}/${type}/search?search=${search}`;
        let response = await this.httpReq(url);

        const $ = this.cheerio.load(response);
        const rows = $('div.project-listing-row');

        let data = helper.parseProjectList($, rows, this.config.baseUrl);

        if(data.length === 0){
            res.status(204);
        }
        await res.json(data);
    }


}

module.exports = SearchMethod;
