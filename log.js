
var logger = require('winston');
// Setup logger
logger.remove(logger.transports.Console);
logger.add(logger.transports.Console, {colorize: true});

exports.logger = logger;
