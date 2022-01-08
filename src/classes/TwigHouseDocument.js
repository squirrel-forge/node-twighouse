/**
 * Requires
 */
const path = require( 'path' );
const { Exception, FsInterface } = require( '@squirrel-forge/node-util' );

/**
 * TwigHouse exception
 * @class
 */
class TwigHouseDocumentException extends Exception {}

/**
 * TwigHouse Document Object
 * @class
 */
class TwigHouseDocument {

    /**
     * Constructor
     * @constructor
     * @param {string} reference - Reference string
     * @param {TwigHouse} twigH - TwigHouse instance
     * @throws {TwigHouseDocumentException}
     */
    constructor( reference, twigH ) {

        // Require reference
        if ( typeof reference !== 'string' || !reference.length ) {
            throw new TwigHouseDocumentException( 'Constructor argument reference must be a non empty string' );
        }

        // Require TwigHouse
        if ( !twigH || typeof twigH !== 'object' ) {
            throw new TwigHouseDocumentException( 'Constructor argument twigH must be a TwigHouse instance' );
        }

        // Parse reference
        const { name, dir } = path.parse( reference );

        /**
         * TwigHouse instance
         * @protected
         * @property
         * @type {TwigHouse}
         */
        this._twigH = twigH;

        /**
         * Source reference
         * @public
         * @property
         * @type {string}
         */
        this.source = reference;

        /**
         * Root path
         * @public
         * @property
         * @type {string}
         */
        this.root = twigH.getPath( 'data', dir[ 0 ] === '/' );

        /**
         * Document slug
         * @public
         * @property
         * @type {string}
         */
        this.slug = name;

        /**
         * Document relative path to root
         * @public
         * @property
         * @type {string}
         */
        this.dir = FsInterface.relative2root( dir, this.root );

        /**
         * Document reference
         * @private
         * @property
         * @type {string}
         */
        this._ref = path.join( this.dir, name );

        /**
         * Generated uri
         * @public
         * @property
         * @type {string}
         */
        this.uri = this._uri();

        /**
         * Generated url
         * @public
         * @property
         * @type {string}
         */
        this.url = this._url();
    }

    /**
     * Abstract getter
     * @protected
     * @param {string} prop - Property name
     * @return {string} - Property value
     */
    _get( prop ) {
        return this[ '_' + prop ];
    }

    /**
     * Abstract setter
     * @protected
     * @param {string} prop - Property name
     * @param {string} value - Property value
     * @param {boolean} noSet - Property is read only
     * @return {string} - Property value
     */
    _set( prop, value, noSet = false ) {
        if ( noSet ) {
            throw new Error( 'Property "' + prop + '" is read only, cannot change to: ' + value );
        }
        this[ '_' + prop ] = value;
    }

    /**
     * Getter: Reference
     * @public
     * @return {string} - Page reference
     */
    get ref() {
        return this._get( 'ref' );
    }

    /**
     * Setter: Reference
     * @public
     * @param {string} value - Page reference
     */
    set ref( value ) {
        this._set( 'ref', value, true );
    }

    /**
     * Get uri from data
     * @param {string} reference - Reference path
     * @param {string} root - Root path
     * @param {TwigHouse} twigH - TwigHouse instance
     * @return {string} - Uri
     */
    static getUriFrom( reference, root, twigH ) {
        const { name, dir, ext } = path.parse( reference );
        const rel = FsInterface.relative2root( dir, root );
        return twigH._config.docRoot + ( rel.length ? rel + '/' : '' ) + name + ext;
    }

    /**
     * Get url from data
     * @param {string} reference - Reference path
     * @param {string} root - Root path
     * @param {TwigHouse} twigH - TwigHouse instance
     * @return {string} - Url
     */
    static getUrlFrom( reference, root, twigH ) {
        return twigH._config.docDomain + TwigHouseDocument.getUriFrom( reference, root, twigH );
    }

    /**
     * Get document uri
     * @protected
     * @return {string} - Document uri
     */
    _uri() {
        return this._twigH._config.docRoot + ( this.dir.length ? this.dir + '/' : '' )
            + ( this._twigH._config.docOmitIndex && this.slug === 'index' ? ''
                : this.slug + this._twigH._config.docExt );
    }

    /**
     * Get document uri
     * @protected
     * @return {string} - Document uri
     */
    _url() {
        return this._twigH._config.docDomain + this.uri;
    }

    /**
     * To object converter
     * @public
     * @param {boolean} verbose - Output source and root
     * @return {Object} - Plain object representation of document
     */
    toObject( verbose = false ) {
        const props = [ 'slug', 'dir', 'ref', 'uri', 'url' ];
        if ( verbose ) {
            props.unshift( 'source', 'root' );
        }
        const data = {};
        for ( let i = 0; i < props.length; i++ ) {
            const prop = props[ i ];
            data[ prop ] = this[ prop ];
        }
        return data;
    }

    /**
     * To string converter
     * @public
     * @return {string} - String representation of document
     */
    toString() {
        return 'TwigHouseDocument: ' + JSON.stringify( this.toObject(), null, 2 );
    }
}
module.exports = TwigHouseDocument;
