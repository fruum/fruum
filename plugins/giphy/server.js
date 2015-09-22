/******************************************************************************
  Post context processor to load giphy icons.
  Listens to /giphy <search> and alters the post with a giphy image link
*******************************************************************************/

var giphy = require('giphy-api')();

function GiphyProcessor(options) {
  this.add = function(payload, callback) {
    var document = payload.document;
    if (document.get('type') === 'post') {
      var body = document.get('body');
      if (body.indexOf('/giphy ') === 0) {
        body = body.substr(7);
        giphy.random({
          tag: body
        }, function(err, res) {
          if (res && res.data && res.data.image_url) {
            document.set('body',
              '*' + document.get('body') + '*\n\n' +
              '![' + body + '](' + res.data.image_url + ')'
            );
          }
          callback(null, payload);
        });
        return;
      }
    }
    callback(null, payload);
  }
}

module.exports = GiphyProcessor;
