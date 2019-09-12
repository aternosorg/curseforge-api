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
        if (req.query['filter-game-version'] !== undefined) {
            addopts += "&filter-game-version=" + req.query['filter-game-version'];
        }else if (req.query['filter-game-version-name'] !== undefined) {
            let response = await this.httpReq(`${this.config.baseUrl}${game}/${type}`);
            let version = await helper.getGameVersions(this.cheerio.load(response))
                .filter(v => v.name === req.query['filter-game-version-name'])[0];
            if(version){
                addopts += "&filter-game-version=" + version.id;
            }
        }
        let url = `${baseUrl}${game}/${type}/${slug}/files/all`;

        let data = {
            files: [],
            pagination: {
                page: 1,
                lastPage: 1
            }
        };
        do {
            req.timers.start(`page ${page}`);
            let response = await this.httpReq(`${url}?page=${page}${addopts}`);
            const $ = this.cheerio.load(response);
            const rows = $('.project-file-listing > tbody > tr');

            let pagination = helper.paginationInfo($);
            if (pagination.exists && !pagination.pages.includes(String(page))) {
                break;
            }
            data.pagination = {
                page: page,
                lastPage: pagination.last || 1
            };
            data.files = data.files.concat(helper.parseFileList($, rows, baseUrl, `${game}/${type}/${slug}/download/`));
            if (pagination.exists && pagination.lastPage) {
                break;
            }
            if (!pagination.exists) {
                break;
            }
            page++;
        } while (!single && page <= 5);

        if (single && data.files.length === 0) {
            return res.httpError(404, null);
        }

        await res.json(data);
    }


}

module.exports = FilesMethod;
