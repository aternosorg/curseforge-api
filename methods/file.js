const Method = require('../lib/method');
const helper = require("../lib/helper");

class FileMethod extends Method {
    get route() {
        return '/:game/:type/:slug/files/:fileId';
    }

    async call(req, res) {
        const game = req.params.game;
        const type = req.params.type;
        const slug = req.params.slug;
        const fileId = req.params.fileId;
        const url = `${this.config.baseUrl}${game}/${type}/${slug}/files/${fileId}`;

        let response = await this.httpReq(url);
        const $ = this.cheerio.load(response);

        let data = {};

        const fileInfoFields = $('div.flex.justify-between > div.flex > span.text-sm:not(.font-bold)');
        const supportedVersionFields = $('section.flex > div > div > div > span.tag');

        data.type = $('div.flex.justify-between > div.flex.align-center.items-center > div.mr-2').text().trim();
        data.name = $('div.flex.justify-between > div.flex.align-center.items-center > a > h3').text().trim();
        data.filename = $(fileInfoFields[0]).text().trim();
        data.uploadedBy = $('div.flex.justify-between > div.flex > a > span.text-sm:not(.font-bold)').text().trim();
        data.date = parseInt($(fileInfoFields[1]).children('abbr.standard-date').attr('data-epoch'));
        data.gameVersion = $(fileInfoFields[2]).text().trim();
        data.size = $(fileInfoFields[3]).text().trim();
        data.downloads = parseInt($(fileInfoFields[4]).text().trim().replace(/,/g, ''));
        data.md5 = $(fileInfoFields[5]).text().trim();
        data.supportedVersions = [];
        supportedVersionFields.each(function () {
            data.supportedVersions.push($(this).text().trim());
        });
        data.additionalFiles = helper.parseFileList($, $('.project-file-listing > tbody > tr'), this.config.baseUrl, `${game}/${type}/${slug}/download/`);

        const changelog = $('div.flex > div.bg-accent.rounded > div.user-content');
        data.changelog = changelog.length ? changelog.html().replace(/(\s)+/g, " ").trim() : '';
        data.rawchangelog = changelog.length ? changelog.text().replace(/(\s)+/g, " ").trim() : '';

        await res.json(data);
    }


}

module.exports = FileMethod;
