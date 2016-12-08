/******************************************************************************
Optimize attachments
*******************************************************************************/

'use strict';

var stream = require('stream'),
    streamBuffers = require('stream-buffers'),
    PngQuant = require('pngquant'),
    jpeg = require('jpeg-js'),
    logger = require('../logger');

module.exports = function(options, instance, self) {
  // -------------------------------- COMPRESS IMAGES -----------------------------------

  self.optimize = function(socket, payload) {
    var app_id = socket.app_id,
        user = socket.fruum_user;

    if (user.get('anonymous')) {
      logger.error(app_id, 'optimize_anonymous_noperm', user);
      socket.emit('fruum:optimize');
    }

    if (payload.data && payload.type == 'image') {
      var mime = '', data = '', compressor;
      if (payload.data.indexOf('data:image/png;base64,') == 0) {
        mime = 'data:image/png;base64,';
        data = payload.data.replace(mime, '');
        compressor = new PngQuant([64]);
      } else if (payload.data.indexOf('data:image/jpeg;base64,') == 0) {
        try {
          logger.info(app_id, 'optimizing', payload.data.length);
          mime = 'data:image/jpeg;base64,';
          data = payload.data.replace(mime, '');
          data = jpeg.encode(jpeg.decode(new Buffer(data, 'base64')), 50);
          payload.data = mime + data.data.toString('base64');
          payload.optimized_size = payload.data.length;
          logger.info(app_id, 'optimized_to', payload.data.length);
        } catch (e) {
          logger.error(app_id, 'jpeg_compress', e);
        }
        socket.emit('fruum:optimize', payload);
        return;
      }
      if (mime && data && compressor) {
        logger.info(app_id, 'optimizing', payload.data.length);
        payload.original_size = data.length;

        var readStream = new streamBuffers.ReadableStreamBuffer(),
            writeStream = new stream.PassThrough();

        // handle errors
        readStream.on('error', function(e) {
          logger.error(app_id, 'optimize_readstream', e);
          socket.emit('fruum:optimize', payload);
        });
        writeStream.on('error', function(e) {
          logger.error(app_id, 'optimize_writestream', e);
          socket.emit('fruum:optimize', payload);
        });
        compressor.on('error', function(e) {
          logger.error(app_id, 'optimize_compressorstream', e);
          socket.emit('fruum:optimize', payload);
        });

        // write stream
        writeStream.data = [];
        writeStream.on('data', function(chunk) {
          this.data.push(chunk);
        });
        writeStream.on('end', function() {
          var b = Buffer.concat(this.data);
          payload.data = mime + b.toString('base64');
          payload.optimized_size = payload.data.length;
          logger.info(app_id, 'optimized_to', payload.data.length);
          socket.emit('fruum:optimize', payload);
        });

        // read stream
        readStream.pipe(compressor).pipe(writeStream);
        readStream.put(new Buffer(data.replace(mime, ''), 'base64'));
        readStream.stop();
      } else {
        socket.emit('fruum:optimize', payload);
      }
    } else {
      socket.emit('fruum:optimize', payload);
    }
  };
};
