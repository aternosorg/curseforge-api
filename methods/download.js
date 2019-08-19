const Method = require('../lib/method');
const helper = require('../lib/helper');

class DownloadMethod extends Method {
    get route() {
        return '/:game/:type/:slug/download/:file';
    }

    async call(req, res) {
        let url = this.config.baseUrl + req.params.game + '/' + req.params.type + '/' + req.params.slug + '/download/' + req.params.file + '/file';
        req.timers.start('fetch');
        const response = await helper.getResponseHeaders(url, this.gotModule);
        req.timers.stop('fetch');

        let data = {};
        data.id = parseInt(req.params.file);
        data.target = response.url;
        data.type = response.headers['content-type'];
        data.size = response.headers['content-length'];
        await res.json(data);
    }
}

module.exports = DownloadMethod;
