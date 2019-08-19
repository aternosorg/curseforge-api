const Method = require('../lib/method');
const helper = require("../lib/helper");

class FilesMethod extends Method {
    get route() {
        return '/:game/:type/:slug/files';
    }

    async call(req, res) {
        let single = false;
        let page = 1;
        if (req.query.page !== undefined) {
            single = true;
            page = parseInt(req.query.page);
        }
        const game = req.params.game;
        const type = req.params.type;
        const slug = req.params.slug;

        const baseUrl = this.config.baseUrl;

        let addopts = "";
        if (req.query.sort !== undefined) {
            addopts += "&sort=" + req.query.sort;
        }
        let url = `${baseUrl}${game}/${type}/${slug}/files/all`;

        let data = [];
        do {
            req.timers.start(`page ${page}`);
            let response = await this.httpReq(`${url}?page=${page}${addopts}`);
            const $ = this.cheerio.load(response);
            const rows = $('.project-file-listing > tbody > tr');

            let pagination = helper.paginationInfo($);
            if (pagination.exists && !pagination.pages.includes(String(page))) {
                break;
            }
            data = data.concat(helper.parseFileList($, rows, baseUrl, `${game}/${type}/${slug}/download/`));
            if (pagination.exists && pagination.lastPage) {
                break;
            }
            if (!pagination.exists) {
                break;
            }
            page++;
        } while (!single && page <= 5);

        if (single && data.length === 0) {
            return res.httpError(404, null);
        }

        await res.json(data);
    }


}

module.exports = FilesMethod;
