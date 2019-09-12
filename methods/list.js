const Method = require('../lib/method');
const helper = require("../lib/helper");

class ListMethod extends Method {
    get route() {
        return '/:game/:type';
    }

    async call(req, res) {
        const game = req.params.game;
        const type = req.params.type;
        const category = req.query.category;
        let addopts = (req.query['filter-game-version'] ? `&filter-game-version=${req.query['filter-game-version']}` : '');
        addopts += (req.query['filter-sort'] ? `&filter-sort=${req.query['filter-sort']}` : '');
        const url = `${this.config.baseUrl}${game}/${type}` + (category ? '/' + category : '');

        let page = 1;
        if (req.query.page !== undefined) {
            page = parseInt(req.query.page);
        }

        let response = await this.httpReq(`${url}?page=${page}${addopts}`);
        const $ = this.cheerio.load(response);
        const rows = $('div.project-listing-row');

        let pagination = helper.paginationInfo($);
        if (pagination.exists && !pagination.pages.includes(String(page))) {
            return res.httpError(404, null);
        }

        let data = {
            projects: helper.parseProjectList($, rows, this.config.baseUrl),
            pagination: {
                page: page,
                lastPage: pagination.last || 1
            }
        };

        await res.json(data);
    }


}

module.exports = ListMethod;
