/**
 * Requires
 */
const Exception = require( './Exception' );

/**
 * Exception Class
 * @class
 */
module.exports = class Warning extends Exception {

    /**
     * Constructor
     * @constructor
     * @param {string} message - Exception message
     * @param {null|string|Error|Exception} previous - Previous exception
     * @param {string} prefix - Message prefix
     * @param {string} suffix - Message suffix
     */
    constructor( message, previous = null, { prefix = '\x1b[43m\x1b[37m ', suffix = ' \x1b[0m' } = {} ) {
        super( message, previous, { prefix, suffix } );
    }
};
