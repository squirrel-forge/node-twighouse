/**
 * Requires
 */
const intercept = require( 'intercept-stdout' );

/**
 * Output Buffer class
 * @class
 */
module.exports = class OutputBuffer {

    /**
     * Constructor
     * @constructor
     */
    constructor() {

        /**
         * End callback
         * @protected
         * @type {null|Function}
         */
        this._end = null;

        /**
         * Buffer contents
         * @protected
         * @type {Array<string>}
         */
        this._ = [];
    }

    /**
     * Flush buffer
     * @return {OutputBuffer} - Self instance
     */
    flush() {
        this._ = [];
        return this;
    }

    /**
     * Get buffer contents and flush
     * @return {Array<string>} - Buffer contents
     */
    reduce() {
        const buffer = this.contents();
        this.flush();
        return buffer;
    }

    /**
     * Get buffer contents
     * @return {Array<string>} - Buffer contents
     */
    contents() {
        return this._;
    }

    /**
     * Get buffer length
     * @return {number} - Number of entries in buffer
     */
    get length() {
        return this._.length;
    }

    /**
     * Set buffer length
     * @param {number} value - Cannot be set
     * @throws {Error}
     * @return {void}
     */
    set length( value ) {
        throw new Error( 'Cannot set length property on OutputBuffer' );
    }

    /**
     * Start buffering
     * @return {OutputBuffer} - Self instance
     */
    start() {
        this._end = intercept( ( text ) => {
            this._.push( text );
            return '';
        } );
        return this;
    }

    /**
     * End buffering
     * @return {OutputBuffer} - Self instance
     */
    end() {
        if ( typeof this._end === 'function' ) {
            this._end();
            this._end = null;
        }
        return this;
    }
};
