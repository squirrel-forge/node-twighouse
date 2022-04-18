/**
 * Requires
 */
const { Exception, isPojo } = require( '@squirrel-forge/node-util' );

/**
 * HTMLAttributes exception
 * @class
 */
class HTMLAttributesException extends Exception {}

/**
 * HTML attributes
 * @class
 * @type {HTMLAttributes}
 */
class HTMLAttributes {

    /**
     * Constructor
     * @constructor
     * @param {string|Array|Object} data - Attribute data
     */
    constructor( data = null ) {

        /**
         * Attributes that get converted to arrays internally
         * @protected
         * @property
         * @type {string[]}
         */
        this._convert2array = [ 'class' ];

        /**
         * Attribute data
         * @public
         * @property
         * @type {Object}
         */
        this.data = {};

        // Parse input data
        if ( isPojo( data ) ) {
            const values = Object.entries( data );
            for ( let i = 0; i < values.length; i++ ) {
                const [ name, value ] = values[ i ];
                this.set( name, value );
            }
        } else if ( data instanceof Array ) {
            this._requireAttribute( 'class', data );
        } else if ( typeof data === 'string' && data.length ) {
            this._requireAttribute( 'id', data );
        }
    }

    /**
     * Require attribute name with default value
     * @protected
     * @param {string} name - Attribute name
     * @param {*} value - Default value
     * @return {void}
     */
    _requireAttribute( name, value ) {
        if ( !this.data[ name ] ) {
            this.data[ name ] = value;
        }
    }

    /**
     * Set attribute
     * @param {string} name - Attribute name
     * @param {*} value - Attribute value
     * @return {HTMLAttributes} - Self for chaining
     */
    set( name, value ) {
        if ( typeof name !== 'string' || !name.length ) {
            throw new HTMLAttributesException( 'Invalid attribute name' );
        }
        if ( this._convert2array.includes( name ) && !( value instanceof Array ) ) {
            if ( typeof value === 'string' ) {
                value = value.split( ' ' );
            } else {
                value = [ value ];
            }
        }
        this.data[ name ] = value;
        return this;
    }

    /**
     * Has given attribute
     * @param {string} name - Attribute name
     * @return {boolean} - True if attribute is set
     */
    has( name ) {
        return !!this.data[ name ] || typeof this.data[ name ] === 'string';
    }

    /**
     * Add class
     * @param {string|Array} classname - Classname
     * @return {HTMLAttributes} - Self for chaining
     */
    addClass( classname ) {
        if ( !classname ) return this;
        if ( classname instanceof Array ) {
            return this.addClasses( classname );
        }
        if ( typeof classname !== 'string' ) {
            throw new HTMLAttributesException( 'Invalid class value ' + typeof classname );
        }
        if ( classname.length ) {
            this._requireAttribute( 'class', [] );
            if ( !this.data[ 'class' ].includes( classname ) ) {
                this.data[ 'class' ].push( classname );
            }
        }
        return this;
    }

    /**
     * Add classes
     * @param {string|Array} classnames - Classnames array
     * @return {HTMLAttributes} - Self for chaining
     */
    addClasses( classnames ) {
        if ( classnames instanceof Array ) {
            for ( let i = 0; i < classnames.length; i++ ) {
                this.addClass( classnames[ i ] );
            }
        } else {
            this.addClass( classnames );
        }
        return this;
    }

    /**
     * Converts attribute data
     * @return {string} - Compiled html tag attributes
     */
    toString() {
        const result = [];
        const data = Object.entries( this.data );
        for ( let i = 0; i < data.length; i++ ) {
            const [ name, value ] = data[ i ];

            // Skip special properties
            if ( name.substr( 0, 2 ) === '__' ) {
                continue;
            }

            // Only add none empties
            if ( value !== null && typeof value !== 'undefined' ) {
                let quotes = '"', output = value;
                const to = typeof output;
                if ( to === 'boolean' ) {
                    output = output ? 'true' : 'false';
                } else if ( output instanceof Array && output.every( ( v ) => { return typeof v === 'string'; } ) ) {
                    output = output.join( ' ' );
                } else if ( to !== 'string' ) {
                    output = JSON.stringify( output );
                    quotes = '\'';
                }
                result.push( name + ( output.length ? '=' + quotes + output + quotes : '' ) );
            }
        }
        return result.join( ' ' );
    }
}
module.exports = HTMLAttributes;
