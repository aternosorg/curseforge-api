const Method = require('../lib/method');
const helper = require('../lib/helper');

class CategoriesMethod extends Method {
    get route() {
        return '/other/:game/:type/versions';
    }

    async call(req, res) {
        const game = req.params.game;
        const type = req.params.type;

        let response = await this.httpReq(`${this.config.baseUrl}${game}/${type}`);
        await res.json(helper.getGameVersions(this.cheerio.load(response)));
    }


}

module.exports = CategoriesMethod;
