const Method = require('../lib/method');

class CategoriesMethod extends Method {
    get route() {
        return '/other/:game/:type/categories';
    }

    async call(req, res) {
        const game = req.params.game;
        const type = req.params.type;
        const url = `${this.config.baseUrl}${game}/${type}`;

        let response = await this.httpReq(url);
        const $ = this.cheerio.load(response);

        let data = [];

        const categoryFields = $('div.category-list-item > div > a');
        $(categoryFields).each(function(){
            if(!$(this).attr('href')){
                return;
            }
            let category = {};
            category.displayname = $(this).find('span.whitespace-no-wrap').text().trim();
            category.name = $(this).attr('href').split('/').splice(3).join('/');
            category.icon = $(this).find('figure.relative > img').attr('src');
            data.push(category);
        });

        await res.json(data);
    }


}

module.exports = CategoriesMethod;
