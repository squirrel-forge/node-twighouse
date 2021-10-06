/* global require, module, process, __dirname */
'use strict';

/**
 * Requires
 */
const path = require( 'path' );
const fs = require( 'fs' );
const dirTree = require("directory-tree");
const Twig = require( 'twig' );
const minify = require('html-minifier').minify;
const cfx = require( '@squirrel-forge/node-cfx' ).cfx
const objm = require( '@squirrel-forge/node-objection' );
const isPojo = require( './isPojo' );
const trimChar = require( './trimChar' );
const parseInput = require( './parseInput' );

/**
 * Twig House class
 * @type {TwigHouse}
 */
module.exports = class TwigHouse {

    /**
     * Constructor
     */
    constructor() {

        // Install location
        this._self = path.resolve( __dirname, '../' );

        // Input arguments and options
        this._input = parseInput();
        this._data_dir = '';
        this._default_minify = {
            "removeComments": true,
            "collapseWhitespace": true,
            "minifyJS": true,
            "minifyCSS": true,
        };

        // Internal data
        this._fragments = {};
        this._pages = {};
        this._rendered = {};
        this._plugin_methods = {};
        this._available_methods = [ 'modify_data', 'modify_html', 'modify_twig' ];
        this._reserved_data_folders = [ '__fragments', '__plugins' ];
        this._magic_page = '__page';
    }

    _load_plugins( tree ) {
        for ( let i = 0; i < tree.length; i++ ) {
            const plugin_path = path.resolve( tree[ i ].path );
            const plugin = require( plugin_path );
            if ( typeof plugin !== 'object' ) {
                cfx.error( 'Failed to load plugin from: ' + plugin_path );
                continue;
            }
            for ( let j = 0; j < this._available_methods.length; j++ ) {
                const method_name = this._available_methods[ j ];
                if ( plugin[ method_name ] instanceof Function ) {
                    if ( !this._plugin_methods[ method_name ] ) {
                        this._plugin_methods[ method_name ] = [];
                    }
                    plugin[ method_name ].__plugin_name = tree[ i ].name;
                    this._plugin_methods[ method_name ].push( plugin[ method_name ] );
                }
            }
        }
    }

    async _call_plugins( method, args ) {
        const methods = this._plugin_methods[ method ];
        if ( methods ) {
            for ( let i = 0; i < methods.length; i++ ) {
                try {
                    await methods[ i ]( ...args );
                } catch ( e ) {
                    cfx.error( '[' + methods[ i ].__plugin_name + '@' + method + '] ' + e );
                }
            }
        }
    }

    /**
     * Read local file as buffer
     * @private
     * @param {string} file
     * @param {string} enc
     * @return {Promise<Buffer|null>}
     */
    _read_local( file, enc = 'utf8' ) {
        return new Promise( ( resolve ) => {
            fs.readFile( file, enc, ( err, content ) => {
                if ( err ) {
                    cfx.error( err );
                    resolve( null );
                } else {
                    const buffer = Buffer.from( content );
                    resolve( buffer );
                }
            } );
        } );
    }

    /**
     * Resolve text file
     * @private
     * @param {string} file
     * @return {Promise<{path, ext, content, type, text}|null>}
     */
    async _resolve_text( file ) {
        const buf = await this._read_local( file, 'utf8' );
        return buf.toString( 'utf8' );
    }

    /**
     * Resolve json file
     * @private
     * @param {string} file
     * @return {Promise<{path, ext, content, type, json}|null>}
     */
    async _resolve_json( file ) {
        const text = await this._resolve_text( file );
        if ( text ) {
            try {
                return JSON.parse( text );
            } catch ( e ) {
                cfx.error( '[' + file + '] ' + e );
            }
        }
        return null;
    }

    /**
     * Check if local file exists
     * @private
     * @param {string} file
     * @param {string} type
     * @return {Promise<boolean>}
     */
    _local_exists( file, type = 'R_OK' ) {
        return new Promise( ( resolve ) => {
            fs.access( file, fs.constants[ type ], ( err ) => {
                if ( err ) {
                    resolve( false );
                } else {
                    resolve( true );
                }
            });
        } );
    }

    /**
     * Write local file
     * @private
     * @param {string} file
     * @param {string} content
     * @return {Promise<boolean>}
     */
    _local_write( file, content ) {
        return new Promise( ( resolve ) => {
            fs.writeFile( file, content, ( err ) => {
                if ( err ) {
                    cfx.error( err );
                    resolve( false );
                } else {
                    resolve( true );
                }
            } );
        } );
    }

    /**
     * Write local dir
     * @private
     * @param {string} dir
     * @return {Promise<boolean>}
     */
    _write_dir( dir ) {
        return new Promise( ( resolve ) => {
            fs.mkdir( dir, { recursive : true }, ( err ) => {
                if ( err ) {
                    cfx.error( err );
                    resolve( false );
                } else {
                    resolve( true );
                }
            } );
        } );
    }

    /**
     * Render template
     * @private
     * @param {string} template
     * @param {Object} data
     * @return {Promise<string>}
     */
    _render_template( template, data ) {
        return new Promise( ( resolve, reject ) => {
            Twig.renderFile( template, data, ( err, html ) => {
                if ( err ) {
                    cfx.error( err );
                    reject( err );
                } else {
                    resolve( html );
                }
            } );
        } );
    }

    /**
     * Get flag/option value
     * @private
     * @param {string} flag
     * @param {*} def
     * @return {null|boolean|string}
     */
    _get_flag_value( flag, def = null ) {
        let value = def;
        for ( let i = 0; i < this._input.flags.length; i++ ) {
            if ( this._input.flags[ i ] instanceof Array && this._input.flags[ i ][ 0 ] === flag ) {
                value = trimChar( trimChar( this._input.flags[ i ][ 1 ], '"' ), "'" );
            } else if ( this._input.flags[ i ] === flag ) {
                value = true;
            }
        }
        return value;
    }

    _get_rel_dir( dir, root ) {
        let rel_dir = dir.substr( root.length );
        if ( rel_dir.length && rel_dir[ 0 ] === path.sep ) {
            rel_dir = rel_dir.substr( 1 );
        }
        return rel_dir;
    }

    async _collect_pages( tree ) {
        for ( let i = 0; i < tree.length; i++ ) {
            if ( tree[ i ].children ) {
                if ( !this._reserved_data_folders.includes( tree[ i ].name ) && tree[ i ].children.length ) {
                    this._collect_pages( tree[ i ].children );
                }
            } else {
                await this._build_page( tree[ i ] );
            }
        }
    }

    async _build_page( file ) {
        const { name, dir } = path.parse( file.path );
        const rel_dir = this._get_rel_dir( dir, this._data_dir );
        const json = await this._get_page_json( file.path );
        const ref = path.join( rel_dir, name );
        json.document = {
            path : ref,
            dir : rel_dir,
            slug : name,
            uri : ( rel_dir.length ? path.sep + rel_dir : '' )
                + ( name !== 'index' ? path.sep + name : path.sep ),
        }
        this._pages[ ref ] = json;
        await this._call_plugins( 'modify_data', [ ref, json, this ] );
    }

    async _get_page_json( file_path ) {
        const source = await this._resolve_json( file_path );
        const compiled = {};
        await this._resolve_json_tree( source, compiled )
        return compiled;
    }

    async _resolve_json_tree( source, compiled ) {
        const has_fragment = !!source.__fragment;
        if ( has_fragment ) {
            const fragment = await this._get_fragment( source.__fragment );
            if ( fragment ) {
                Object.assign( compiled, fragment );
            } else {
                compiled.__error = 'Failed to resolve fragment: ' + source.__fragment;
                cfx.error( compiled.__error );
            }
        }
        for ( const [ key, value ] of Object.entries( source ) ) {
            if ( isPojo( value ) ) {
                compiled[ key ] = {};
                await this._resolve_json_tree( source[ key ], compiled[ key ] );
            } else {
                compiled[ key ] = value;
            }
        }
    }

    async _get_fragment( name ) {
        if ( !this._fragments[ name ] ) {
            await this._load_fragment( name );
        }
        if ( this._fragments[ name ] ) {
            if ( this._fragments[ name ].__fragment_by === 'reference' ) {
                return this._fragments[ name ];
            }
            return objm.cloneObject( this._fragments[ name ], true );
        }
        return null;
    }

    async _load_fragment( name ) {
        const frag_path = path.join( this._data_dir, '__fragments', name + '.json' );
        const exists = await this._local_exists( frag_path );
        if ( exists ) {
            const json = await this._resolve_json( frag_path );
            if ( json ) {
                this._fragments[ name ] = json;
                return true;
            }
        }
        return false;
    }

    async _render_page( ref, data, primary, fallback ) {
        let template = null;
        const primary_exists = await this._local_exists( primary );
        if ( primary_exists ) {
            template = primary;
        } else {
            const fallback_exists = await this._local_exists( fallback );
            if ( fallback_exists ) {
                cfx.info( 'Using fallback: ' + fallback + ' for page: ' + ref );
                template = fallback;
            }
        }
        if ( !template ) {
            cfx.error( 'Failed to load template: ' + primary + ' or fallback: ' + fallback );
            return;
        }
        this._rendered[ ref ] = await this._render_template( template, data );
        await this._call_plugins( 'modify_html', [ ref, this._rendered, this ] );
    }

    async _render_pages( target, templates ) {
        for ( const [ key, value ] of Object.entries( this._pages ) ) {
            const primary = path.join( templates, value.__template || value.document.path ) + '.twig';
            const fallback = path.join( templates, this._magic_page ) + '.twig';
            await this._render_page( key, value, primary, fallback );
        }
    }

    _minify_doc( doc, data ) {
        try {
            return minify( doc, data.__minify || this._default_minify );
        } catch ( e ) {
            cfx.error( e );
        }
        return null;
    }

    async _write_documents( target, minify = false ) {
        for ( const [ key, value ] of Object.entries( this._rendered ) ) {
            const doc_path = path.join( target, key + '.html' );
            const { dir } = path.parse( doc_path );

            // Ensure directory
            const dir_available = await this._write_dir( dir );
            if ( !dir_available ) {
                cfx.error( 'Failed to create directory: ' + dir );
                continue;
            }

            // Get output and write
            const doc = minify ? this._minify_doc( value, this._pages[ key ] ) : value;
            await this._local_write( doc_path, doc );
        }
    }

    /**
     * Run generator
     * @return {Promise<number>}
     */
    async run() {

        // Main arguments
        const source = this._input.args[ 0 ] || '';
        const target = this._input.args[ 1 ] || '';

        // Get pages data tree
        const flag_data = this._get_flag_value( '-d' ) || this._get_flag_value( '--data' );
        this._data_dir = flag_data || path.join( source, 'data' );
        const tree_data = dirTree( this._data_dir, { extensions: /\.json/ } );
        if ( !tree_data || !tree_data.children.length ) {
            cfx.error( 'No possible json sources found' );
            return 1;
        }

        // Load plugins if available
        const path_plugins = flag_data || path.join( source, 'data', '__plugins' );
        const tree_plugins = dirTree( path_plugins, { extensions: /\.js/ } );
        this._load_plugins( tree_plugins.children );

        // Extend twig
        await this._call_plugins( 'modify_twig', [ Twig, this ] );

        // Collect page data
        await this._collect_pages( tree_data.children );
        if ( !Object.entries( this._pages ).length ) {
            cfx.error( 'No page data generated' );
            return 1;
        }

        // Render page templates
        const flag_templates = this._get_flag_value( '-t' ) || this._get_flag_value( '--templates' );
        const path_templates = flag_templates || path.join( source, 'templates' );
        await this._render_pages( target, path_templates );

        // Write pages to target
        const flag_minify = this._get_flag_value( '-m' ) || this._get_flag_value( '--minify' );
        await this._write_documents( target, flag_minify );

        // End with success
        return 0;
    }
}
