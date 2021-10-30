/**
 * Requires
 */
const parseInput = require( '../fn/parseInput' );
const trimChar = require( '../fn/trimChar' );

/**
 * Cli input
 * @class
 * @type {CliInput}
 */
class CliInput {

    /**
     * Constructor
     * @constructor
     * @param {null|Array<string>} args - Arguments, options and flags
     * @param {boolean} trimQuotes - Trim single and double quotes from options input
     * @param {null|Array<string>} false_values - List of strings that represent a false value
     */
    constructor( args = null, trimQuotes = true, false_values = null ) {

        /**
         * False values
         * @protected
         * @property
         * @type {Array<string>|string[]}
         */
        this._f = false_values || [ 'no', 'false', 'disable' ];

        /**
         * Parsed input object
         * @protected
         * @property
         * @type {CliInputData}
         */
        this._i = parseInput( args );

        /**
         * Trim quotes option
         * @public
         * @property
         * @type {boolean}
         */
        this.trimQuotes = trimQuotes;
    }

    /**
     * Get flag/option value
     * @public
     * @param {string} flag - Flag name including dash'es
     * @param {null|*} default_value - Default value if flag not set
     * @return {null|boolean|string|*} - Flag {boolean}, option {string} or default {*} value
     */
    flag( flag, default_value = null ) {
        let value = default_value;
        for ( let i = 0; i < this._i.flags.length; i++ ) {
            if ( this._i.flags[ i ] instanceof Array && this._i.flags[ i ][ 0 ] === flag ) {
                value = this.trimQuotes ?
                    trimChar( this._i.flags[ i ][ 1 ], '"\'' )
                    : this._i.flags[ i ][ 1 ];
            } else if ( this._i.flags[ i ] === flag ) {
                value = true;
            }
        }
        return value;
    }

    /**
     * Get argument by index
     * @public
     * @param {number} index - Argument index
     * @return {null|string} - Argument value if available
     */
    arg( index = 0 ) {
        if ( this._i.args[ index ] ) {
            return this.trimQuotes ?
                trimChar( this._i.args[ index ], '"\'' )
                : this._i.args[ index ];
        }
        return null;
    }

    /**
     * Get flags and options as object
     * @public
     * @param {{name:['short','long','default',boolean]}} src - Options source map
     * @return {{name:*}} - Map of flag and option values
     */
    getFlagsOptions( src ) {
        const check = Object.entries( src );
        const res = {};
        for ( let i = 0; i < check.length; i++ ) {
            const [ short, long, default_value, is_bool ] = check[ i ][ 1 ];
            const name = check[ i ][ 0 ];
            res[ name ] = this.flag( long ) || this.flag( short, default_value );

            const is_str = typeof res[ name ] === 'string';
            if ( is_bool && res[ name ] !== default_value && is_str ) {

                // With boolean option force a boolean type value if its not the default value
                res[ name ] = this._f.indexOf( res[ name ].toLowerCase() ) < 0;
            } else if ( !is_bool && !is_str ) {

                // Not a bool option, force the default value if not a string
                res[ name ] = default_value;
            }
        }
        return res;
    }
}
module.exports = CliInput;
