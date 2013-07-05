
var logger = require('winston'),
    opts   = require('./options');

// Setup logger
logger.remove(logger.transports.Console);
logger.add(logger.transports.Console, {colorize: true, level:opts.log});

exports.logger = logger;
