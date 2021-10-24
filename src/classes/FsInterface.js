/**
 * Requires
 */
const path = require( 'path' );
const fs = require( 'fs' );
const fetch = require( 'node-fetch' );
const dirTree = require( 'directory-tree' );
const Core = require( './Core' );

/**
 * File system interface
 * @class
 * @type {FsInterface}
 */
class FsInterface extends Core {

    /**
     * Constructor
     * @constructor
     * @param {null|console} cfx - Console or alike object
     */
    constructor( cfx = null ) {
        super( cfx );
    }

    /**
     * Read remote file as buffer
     * @public
     * @param {string} url - Url to file
     * @return {Promise<Buffer|null>} - Buffer or null on error
     */
    remote( url ) {
        const _self = this;
        return new Promise( ( resolve ) => {

            /**
             * Successfully loaded
             * @param {Object} res - Fetch buffer
             * @return {Promise<void>} - Possibly throws errors in strict mode
             */
            const success = async function( res ) {
                if ( res.ok ) {
                    const file_buffer = await res.buffer();
                    resolve( file_buffer );
                } else {
                    _self._error( res.status + '#' + res.statusText + ' for: ' + url );
                    resolve( null );
                }
            };
            fetch( url ).then( success ).catch( ( err ) => {
                this._error( err );
                resolve( null );
            } );
        } );
    }

    /**
     * Read remote text file
     * @public
     * @param {string} url - Url to file
     * @return {Promise<string|null>} - UTF8 string
     */
    async remoteText( url ) {
        const buf = await this.remote( url );
        return buf ? buf.toString( 'utf8' ) : null;
    }

    /**
     * Read remote json file
     * @public
     * @param {string} url - Url to file
     * @return {Promise<Array|Object|null>} - JSON data
     */
    async remoteJSON( url ) {
        const text = await this.remoteText( url );
        if ( text ) {
            try {
                return JSON.parse( text );
            } catch ( e ) {
                this._error( '[' + url + '] ' + e );
            }
        }
        return null;
    }

    /**
     * Read local file as buffer
     * @public
     * @param {string} file - Path to file
     * @param {string} enc - Charset
     * @return {Promise<Buffer|null>} - Buffer or null on error
     */
    read( file, enc = 'utf8' ) {
        return new Promise( ( resolve ) => {
            fs.readFile( file, enc, ( err, content ) => {
                if ( err ) {
                    this._error( err );
                    resolve( null );
                } else {
                    const buffer = Buffer.from( content );
                    resolve( buffer );
                }
            } );
        } );
    }

    /**
     * Read local text file
     * @public
     * @param {string} file - Path to file
     * @return {Promise<string|null>} - UTF8 string
     */
    async readText( file ) {
        const buf = await this.read( file, 'utf8' );
        return buf ? buf.toString( 'utf8' ) : null;
    }

    /**
     * Read local json file
     * @public
     * @param {string} file - Path to file
     * @return {Promise<Array|Object|null>} - JSON data
     */
    async readJSON( file ) {
        const text = await this.readText( file );
        if ( text ) {
            try {
                return JSON.parse( text );
            } catch ( e ) {
                this._error( '[' + file + '] ' + e );
            }
        }
        return null;
    }

    /**
     * Check if local file exists
     * @public
     * @param {string} file - Path to file
     * @param {string} type - Access type
     * @return {Promise<boolean>} - True if file exists
     */
    exists( file, type = 'R_OK' ) {
        return new Promise( ( resolve ) => {
            fs.access( file, fs.constants[ type ], ( err ) => {
                if ( err ) {
                    resolve( false );
                } else {
                    resolve( true );
                }
            } );
        } );
    }

    /**
     * Write local file
     * @public
     * @param {string} file - Filepath to write
     * @param {string} content - File content
     * @return {Promise<boolean>} - True if the file was created
     */
    write( file, content ) {
        return new Promise( ( resolve ) => {
            fs.writeFile( file, content, ( err ) => {
                if ( err ) {
                    this._error( err );
                    resolve( false );
                } else {
                    resolve( true );
                }
            } );
        } );
    }

    /**
     * Write local dir
     * @public
     * @param {string} dir - Directory path
     * @return {Promise<boolean>} - True if directory exists or was created
     */
    dir( dir ) {
        return new Promise( ( resolve ) => {
            fs.mkdir( dir, { recursive : true }, ( err ) => {
                if ( err ) {
                    this._error( err );
                    resolve( false );
                } else {
                    resolve( true );
                }
            } );
        } );
    }

    /**
     * Get relative path
     * @public
     * @param {string} dir - Source path
     * @param {string} root - Included root path
     * @return {string} - Path relative to root
     */
    relPath( dir, root ) {
        let rel_dir = dir.substr( root.length );
        if ( rel_dir.length && rel_dir[ 0 ] === path.sep ) {
            rel_dir = rel_dir.substr( 1 );
        }
        return rel_dir;
    }

    /**
     * Get files list
     * @public
     * @param {string} dir - Source directory
     * @param {('json'|'js')|Object} options - directory-tree options
     * @return {Array} - List of files
     */
    getFileList( dir, options ) {

        // Options shortcuts
        if ( options === 'json' ) {
            options = { extensions : /\.json/ };
        } else if ( options === 'js' ) {
            options = { extensions : /\.js/ };
        }

        // Get files tree
        const tree = dirTree( dir, options );
        const result = [];

        // Build flat results array
        if ( tree && tree.children ) {
            this._getFilesRecursiveToFlat( tree.children, result );
        }
        return result;
    }

    /**
     * Convert tree to file list
     * @private
     * @param {dirTree} tree - Tree data
     * @param {Array} result - Files list
     * @return {void}
     */
    _getFilesRecursiveToFlat( tree, result ) {
        for ( let i = 0; i < tree.length; i++ ) {
            if ( tree[ i ].children ) {

                // Iterate down the tree
                this._getFilesRecursiveToFlat( tree[ i ].children, result );
            } else {

                // Add path to list
                result.push( tree[ i ].path );
            }
        }
    }
}
module.exports = FsInterface;
