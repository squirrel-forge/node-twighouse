/**
 * Exception Class
 * @class
 */
module.exports = class Exception extends Error {

    /**
     * Constructor
     * @constructor
     * @param {string} message - Exception message
     * @param {null|string|Error|Exception} previous - Previous exception
     */
    constructor( message, previous = null ) {
        super( message );
        this.name = this.constructor.name;
        this.previous = previous;
        Error.captureStackTrace( this, this.constructor );
        this.stack = this.stack
            + ( this.previous && this.previous.stack ? '\n[Previous] ' + this.previous.stack : '' );
    }

    /**
     * Convert to string
     * @public
     * @return {string} - String representation of the exception
     */
    toString() {
        return super.toString() + ( this.previous ? ' <<< ' + this.previous.toString() : '' );
    }

    /**
     * Convert to local string
     * @public
     * @return {string} - String representation of the exception
     */
    toLocaleString() {
        return super.toLocaleString() + ( this.previous ? ' <<< ' + this.previous.toLocaleString() : '' );
    }
};
