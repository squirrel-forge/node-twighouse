/**
 * Core
 * @class
 */
class Core {

    /**
     * Constructor
     * @constructor
     * @param {null|console} cfx - Console or alike object
     */
    constructor( cfx = null ) {

        /**
         * Error output
         * @private
         * @type {console}
         */
        this._cfx = cfx;
    }

    /**
     * Report
     * @private
     * @param {string} msg - Error message
     * @param {('error'|'warn'|'info')} type - Type of reporting if cfx available
     * @throws Error
     * @return {void}
     */
    _report( msg, type ) {
        if ( this._cfx && this._cfx[ type ] ) {
            this._cfx[ type ]( msg );
        } else {
            throw new Error( msg );
        }
    }

    /**
     * Report error
     * @protected
     * @param {string} msg - Error message
     * @throws Error
     * @return {void}
     */
    _error( msg ) {
        this._report( msg, 'error' );
    }

    /**
     * Report warning
     * @protected
     * @param {string} msg - Warning message
     * @throws Error
     * @return {void}
     */
    _warn( msg ) {
        this._report( msg, 'warn' );
    }

    /**
     * Report info
     * @protected
     * @param {string} msg - Informational message
     * @return {void}
     */
    _info( msg ) {
        this._log( msg, 'info' );
    }

    /**
     * Report success
     * @protected
     * @param {string} msg - Informational message
     * @return {void}
     */
    _success( msg ) {
        this._log( msg, 'success' );
    }

    /**
     * Logs to output
     * @protected
     * @param {*} output - Any loggable output
     * @param {('log'|'info'|'success')} type - Type of reporting if cfx available
     * @return {void}
     */
    _log( output, type = 'log' ) {
        if ( this._cfx && this._cfx[ type ] ) {
            this._cfx[ type ]( output );
        } else {

            // eslint-disable-next-line no-console
            console.log( output );
        }
    }
}
module.exports = Core;
