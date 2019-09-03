let helper = {};

/**
 * Get status code from HTTP response
 *
 * @param resp
 * @returns {*}
 */
helper.getStatusCode = function(resp){
    return resp ? (resp.statusCode || 500) : 500;
};

helper.parseFileList = function($, rows, baseUrl, downloadUrl){
    let data = [];
    rows.each(function () {
        const row = this;
        const cells = $(row).children('td');
        let file = {};
        file.type = $(cells[0]).text().trim();
        file.name = $(cells[1]).children('a:not(.rounded)').text().trim();
        file.url = baseUrl + $(cells[1]).find("a").attr('href').substr(1);
        file.id = parseInt(file.url.split('/').pop());
        file.size = $(cells[2]).text().trim();
        file.date = parseInt($(cells[3]).children('abbr.standard-date').attr('data-epoch'));
        file.supportedVersion = $(cells[4]).find('.mr-2').text().trim();
        file.download = `${baseUrl}${downloadUrl}/${file.id}/file`;
        data.push(file);
    });
    return data;
};

helper.parseProjectList = function($, rows, baseUrl){
    let data = [];
    rows.each(function () {
        let project = {};
        project.avatar = $(this).find('div.project-avatar > a > img').attr('src');

        let projectInfo = $(this).find('div.flex.flex-col').children();
        let links = $(projectInfo[0]).children('a');
        project.title = $(links[0]).text().trim();
        project.url = baseUrl + $(links[0]).attr('href').substr(1);
        project.slug = project.url.split('/').pop();
        project.author = $(links[1]).attr('href').split('/').pop();

        let infoFields = $(projectInfo[1]).children('span');
        let downloads = $(infoFields[0]).text().trim().split(' ')[0];
        const downloadMultiplier = {
            K: 1000,
            M: 1000000
        };
        if(isNaN(parseInt(downloads.slice(-1)))){
            project.downloads = Math.round(parseFloat(downloads) * downloadMultiplier[downloads.slice(-1)]);
        }else{
            project.downloads = parseInt(downloads);
        }
        project.updated = parseInt($(infoFields[1]).children('abbr.standard-date').attr('data-epoch'));
        project.created = parseInt($(infoFields[2]).children('abbr.standard-date').attr('data-epoch'));
        project.shortdescription = $(projectInfo[2]).text().trim();
        project.categories = [];
        let categoryLinks = $(this).children('div.w-full').find('a').filter(function(){
            return $(this).children('figure.relative').length === 1;
        });
        $(categoryLinks).each(function(){
            project.categories.push($(this).attr('href').split('/').splice(3).join('/'));
        });

        data.push(project);
    });
    return data;
};

helper.paginationInfo = function($){
    const paginationElem = $('.pagination.pagination-top');
    let pagination = {
        exists: false,
        pages: [],
        lastPage: false,
        firstPage: false,
        last: 1
    };
    if ($(paginationElem).length > 0) {
        pagination.exists = true;
        for (let part of $(paginationElem).text().split('\n')) {
            let partTrimmed = part.trim();
            if (partTrimmed.length > 0) {
                pagination.pages.push(partTrimmed);
            }
        }
        if(pagination.pages.length){
            pagination.last = parseInt(pagination.pages[pagination.pages.length - 1]);
            pagination.last = isNaN(pagination.last) ? null : pagination.last;
        }
        if($(paginationElem).children('.pagination-next').hasClass("pagination-next--inactive")){
            pagination.lastPage = true;
        }
        if($(paginationElem).children('.pagination-prev').hasClass("pagination-next--inactive")){
            pagination.firstPage = true;
        }
    }
    return pagination;
};

helper.getResponseHeaders = async function(url, got){
    const request = got(url);
    let response = null;
    request.on('response', resp => {
        response = resp;
        request.cancel();
    });
    try {
        await request;
    }catch (e) {

    }
    if(!response){
        throw new Error('Could not fetch headers');
    }
    return response;
};

helper.getGameVersions = function($){
    let versions = [];
    $('#filter-game-version > option').each(function () {
        if($(this).attr('value') === ''){
            return;
        }
        versions.push({
            name: $(this).text().trim(),
            id: $(this).attr('value')
        });
    });
    return versions;
};

module.exports = helper;
