/******************************************************************************
Website scrape plugin
*******************************************************************************/

'use strict';

var summary = require('node-tldr'),
    ogs = require('open-graph-scraper');

function ScrapePlugin(options, instance) {
  instance.server.get('/_/scrape', function(req, res) {
    var url = req.query.u;
    if (!url) {
      return res.json({});
    }
    ogs({ url: url }, function(err, og_result) { // eslint-disable-line
      summary.summarize(url, function(tldr_result) {
        var response = {
          title: '',
          description: '',
          summary: '',
          image: '',
          thumbnail: '',
        };

        if (og_result && og_result.data) {
          if (og_result.data.ogTitle) {
            response.title = og_result.data.ogTitle;
          }
          if (og_result.data.ogDescription) {
            response.description = og_result.data.ogDescription;
          }
          if (og_result.data.ogImage && og_result.data.ogImage.url) {
            response.image = og_result.data.ogImage.url;
          }
          if (og_result.data.twitterImage && og_result.data.twitterImage.url) {
            response.thumbnail = og_result.data.twitterImage.url;
          }
        }

        if (tldr_result) {
          if (tldr_result.title) {
            response.title = response.title || tldr_result.title;
          }
          if (tldr_result.summary && tldr_result.summary.length) {
            response.summary = tldr_result.summary.join('\n');
          }
        }

        res.json(response);
      });
    });
  });
}

module.exports = ScrapePlugin;
