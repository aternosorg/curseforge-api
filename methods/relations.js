const Method = require('../lib/method');
const helper = require("../lib/helper");

class RelationsMethod extends Method {
    get route() {
        return '/:game/:type/:slug/relations/:relation';
    }

    condition(req, res) {
        return ['dependencies', 'dependents'].includes(req.params.relation);
    }

    async call(req, res) {
        const game = req.params.game;
        const type = req.params.type;
        const slug = req.params.slug;
        const relation = req.params.relation;
        let filter = parseInt(req.query['filter-related-' + relation] || req.query.filter);
        let addopts = (!isNaN(filter) ? `&filter-related-${relation}=${filter}` : '');
        const url = `${this.config.baseUrl}${game}/${type}/${slug}/relations/${relation}`;

        let single = false;
        let page = 1;
        if (req.query.page !== undefined) {
            single = true;
            page = parseInt(req.query.page);
        }

        let data = {
            projects: [],
            pagination: {
                page: 1,
                lastPage: 1
            }
        };
        do {
            req.timers.start(`page ${page}`);
            let response = await this.httpReq(`${url}?page=${page}${addopts}`);
            const $ = this.cheerio.load(response);
            const rows = $('ul.listing.listing-project > li:not(.alert)');

            let pagination = helper.paginationInfo($);
            if (pagination.exists && !pagination.pages.includes(String(page))) {
                break;
            }
            data.pagination = {
                page: page,
                lastPage: pagination.last || 1
            };
            data.projects = data.projects.concat(helper.parseProjectList($, rows, this.config.baseUrl));
            if (pagination.exists && pagination.lastPage) {
                break;
            }
            if (!pagination.exists) {
                break;
            }
            page++;
        } while (!single && page <= 5);

        if (single && data.projects.length === 0) {
            return res.httpError(404, null);
        }

        await res.json(data);
    }


}

module.exports = RelationsMethod;
