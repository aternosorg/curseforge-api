const Method = require('../lib/method');
const config = require('../config');

class ProjectMethod extends Method {
    get route() {
        return '/:game/:type/:slug';
    }

    condition(req, res) {
        return req.params.slug !== 'search';
    }

    async call(req, res) {
        let url = config.baseUrl + req.params.game + "/" + req.params.type + "/" + req.params.slug;

        req.timers.start('fetch');
        let response = await this.gotModule(url);
        req.timers.stop('fetch');
        req.timers.start('parse');
        const $ = this.cheerio.load(response.body);
        req.timers.stop('parse');

        req.timers.start('map');
        let data = {};
        data.id = parseInt(this.getNextSpanContent($, "Project ID"));
        data.slug = response.req.path.split("/").pop();
        data.title = $('meta[property="og:title"]').attr("content").trim();
        if (data.title.length === 0) {
            data.title = $('.game-header h2').text().trim();
        }
        data.shortdescription = $('meta[property="og:description"]').attr("content").trim();
        data.url = config.baseUrl + response.req.path.substr(1);
        data.download = config.baseUrl + req.params.game + "/" + req.params.type + "/" + req.params.slug + "/download";
        data.avatar = $('.project-avatar > a > img').attr("src");
        data.created = parseInt($(this.getNextSpan($, "Created")).children('abbr.standard-date').attr('data-epoch'));
        data.updated = parseInt($(this.getNextSpan($, "Updated")).children('abbr.standard-date').attr('data-epoch'));
        data.downloads = parseInt(this.getNextSpanContent($, "Total Downloads").replace(/,/g, ""));

        const description = $('.project-detail__content');
        data.description = description.html().replace(/(\s)+/g, " ").trim();
        data.rawdescription = description.text().replace(/(\s)+/g, " ").trim();

        data.categories = [];
        let categoryLinks = $('aside > div > div > div > div.flex > div > a').filter(function(){
            return $(this).children('figure.relative').length === 1;
        });
        $(categoryLinks).each(function(){
            data.categories.push($(this).attr('href').split('/').splice(3).join('/'));
        });

        req.timers.stop('map');
        req.timers.start('response');
        await res.json(data);
        req.timers.stop('response');
    }

    getNextSpanContent($, content) {
        return $('span').filter(function () {
            return $(this).text().trim() === content;
        }).next().text();
    }

    getNextSpan($, content){
        return $('span').filter(function () {
            return $(this).text().trim() === content;
        }).next()
    }
}

module.exports = ProjectMethod;
