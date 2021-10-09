/* global require, module, process, __dirname */
'use strict';

/**
 * Requires
 */
const path = require( 'path' );
const fs = require( 'fs' );
const dirTree = require("directory-tree");
const copy = require('recursive-copy');
const Twig = require( 'twig' );
const minify = require('html-minifier').minify;
const cfx = require( '@squirrel-forge/node-cfx' ).cfx
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
     * @param {Array} args
     */
    constructor( args ) {

        // Install location
        this._self = path.resolve( __dirname, '../' );

        // Input arguments and options
        this._input = parseInput( args );
        this.minify_options = {
            "removeComments": true,
            "collapseWhitespace": true,
            "minifyJS": true,
            "minifyCSS": true,
        };
        this.resolve_fragments = true;
        this.verbose = false;
        this.magic_page = '__page';
        this.template_ext = '.twig';
        this.custom_template = '__template';

        // Internal data
        this._data_dir = '';
        this._fragments = {};
        this._pages = {};
        this._rendered = {};
        this._directives = {};
        this._plugin_methods = {};
        this._available_methods = [ 'modify_data', 'modify_html', 'modify_twig', 'modify_template' ];
        this._reserved_data_folders = [ '__fragments', '__plugins' ];
    }

    /**
     * Load plugins
     * @private
     * @param {Array} tree
     * @return {void}
     */
    _load_plugins( tree ) {
        for ( let i = 0; i < tree.length; i++ ) {
            const plugin_path = path.resolve( tree[ i ].path );
            const plugin = require( plugin_path );
            if ( plugin === null || typeof plugin !== 'object' ) {
                cfx.error( 'Failed to load plugin from: ' + plugin_path );
                continue;
            }
            if ( typeof plugin.__name !== 'string' || !plugin.__name.length ) {
                cfx.error( 'Plugin requires a __name property with a non empty string' );
                continue;
            }

            // Check for available plugin methods
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

            // Check for plugin directives
            if ( plugin.directives ) {
                for ( const [ key, fn ] of Object.entries( plugin.directives ) ) {
                    if ( fn instanceof Function ) {
                        fn.__plugin = plugin;
                        if ( this._directives[ key ] ) {
                            cfx.warn( 'Replacing ' + this._directives[ key ].__plugin.__name + '@' + key + ' with ' + plugin.__name + '@' + key );
                        }
                        this._directives[ key ] = fn;
                    }
                }
            }
        }
    }

    /**
     * Call method on plugins
     * @private
     * @param {string} method
     * @param {Array} args
     * @return {Promise<void>}
     */
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

    async _collect_pages( tree, limit_index = [] ) {
        for ( let i = 0; i < tree.length; i++ ) {
            if ( tree[ i ].children ) {
                if ( !this._reserved_data_folders.includes( tree[ i ].name ) && tree[ i ].children.length ) {
                    await this._collect_pages( tree[ i ].children, limit_index );
                }
            } else {
                await this._build_page( tree[ i ], limit_index );
            }
        }
    }

    async _build_page( file, limit_index ) {
        const { name, dir } = path.parse( file.path );
        const rel_dir = this._get_rel_dir( dir, this._data_dir );
        const ref = path.join( rel_dir, name );
        if ( limit_index.length && !limit_index.includes( ref ) ) {
            return;
        }
        const doc = {
            path : ref,
            dir : rel_dir,
            slug : name,
            uri : ( rel_dir.length ? rel_dir + path.sep : '' ) + name + '.html',
        };
        const json = await this._get_page_json( file.path, doc );
        json.document = doc
        this._pages[ ref ] = json;
        await this._call_plugins( 'modify_data', [ ref, json, this ] );
    }

    async _get_page_json( file_path, doc ) {
        const source = await this._resolve_json( file_path );
        const compiled = source instanceof Array ? [] : {};
        await this._resolve_json_tree( source, compiled, doc );
        return compiled;
    }

    async _resolve_json_tree( source, compiled, doc ) {
        const is_array = source instanceof Array;
        if ( is_array || isPojo( source ) ) {
            if ( this.resolve_fragments && !is_array ) {
                if ( source.__fragment ) {
                    const fragment = await this._get_fragment( source.__fragment );
                    if ( fragment ) {
                        await this._resolve_json_tree( fragment, compiled, doc );
                    } else {
                        compiled.__error = 'Failed to resolve fragment: ' + source.__fragment;
                        cfx.error( compiled.__error );
                    }
                }
            }
            for ( const [ key, value ] of Object.entries( source ) ) {
                if ( value instanceof Array ) {
                    compiled[ key ] = [];
                } else if ( isPojo( value ) ) {
                    compiled[ key ] = {};
                } else {
                    if ( key === '__fragment' && compiled[ key ] ) {
                        if ( !( compiled[ key ] instanceof Array ) ) {
                            compiled[ key ] = [ compiled[ key ] ];
                        }
                        compiled[ key ].push( value );
                    } else {
                        compiled[ key ] = value;
                    }
                }
                if ( compiled[ key ] !== value ) {
                    await this._resolve_json_tree( value, compiled[ key ], doc );
                }
            }
            if ( compiled.__directives instanceof Array ) {
                for ( let i = 0; i < compiled.__directives.length; i++ ) {
                    const [ name, key ] = compiled.__directives[ i ].split( ':' );
                    if ( !this._directives[ name ] ) {
                        console.error( 'Directive not defined: ' + name );
                        continue;
                    }
                    if ( typeof compiled[ key ] === 'undefined' ) {
                        console.error( 'Directive property not define: ' + name + '@' + key );
                        continue;
                    }
                    await this._directives[ name ]( compiled[ key ], compiled, doc, key, this );
                }
            }
        }
    }

    async _get_fragment( name ) {
        if ( !this._fragments[ name ] ) {
            await this._load_fragment( name );
        }
        if ( this._fragments[ name ] ) {
            return JSON.parse( JSON.stringify( this._fragments[ name ] ) );
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

    async _get_template_path( templates, ref, data ) {
        let available_path = null;
        const paths = [];
        if ( data[ this.custom_template ] ) {
            paths.push( path.join( templates, data[ this.custom_template ] ) );
        }
        paths.push( path.join( templates, data.document.path ) );
        paths.push( path.join( templates, this.magic_page ) );
        await this._call_plugins( 'modify_template', [ paths, templates, ref, data, this ] );
        for ( let i = 0; i < paths.length; i++ ) {
            const path_exists = await this._local_exists( paths[ i ] + this.template_ext );
            if ( path_exists ) {
                available_path = paths[ i ] + this.template_ext;
                if ( this.verbose ) {
                    cfx.info( 'Using template: ' + paths[ i ] + ' for page: ' + ref );
                }
                break;
            }
            if ( this.verbose ) {
                cfx.warn( 'Template not found: ' + paths[ i ] + ' for page: ' + ref );
            }
        }
        return available_path;
    }

    async _render_page( ref, data, template ) {
        this._rendered[ ref ] = await this._render_template( template, data );
        await this._call_plugins( 'modify_html', [ ref, this._rendered, this ] );
    }

    async _render_pages( templates ) {
        for ( const [ key, value ] of Object.entries( this._pages ) ) {
            const template = await this._get_template_path( templates, key, value );
            if ( !template ) {
                cfx.error( 'Failed to load any template for page: ' + key );
                continue;
            }
            await this._render_page( key, value, template );
        }
    }

    _minify_doc( doc, data ) {
        try {
            return minify( doc, data.__minify || this.minify_options );
        } catch ( e ) {
            cfx.error( e );
        }
        return null;
    }

    async _write_documents( target, minify = false, data = null, type = '.html' ) {
        data = data || this._rendered;
        for ( const [ key, value ] of Object.entries( data ) ) {
            const doc_path = path.join( target, key + type );
            const { dir } = path.parse( doc_path );

            // Ensure directory
            const dir_available = await this._write_dir( path.resolve( dir ) );
            if ( !dir_available ) {
                cfx.error( 'Failed to create directory: ' + dir );
                continue;
            }

            // Get output and write
            const doc = minify ? this._minify_doc( value, this._pages[ key ] )
                : ( isPojo( value ) ? JSON.stringify( value, null, 2 ) : value );
            const wrote = await this._local_write( doc_path, doc );
            if ( wrote && this.verbose ) {
                cfx.info( 'Wrote: ' + doc_path + ' for page: ' + key );
            }
        }
    }

    async _deploy_example( target ) {
        try {
            const results = await copy( path.join( this._self, 'example' ), target );
            if ( this.verbose ) {
                cfx.info( 'Copied ' + results.length + ' example files' );
            }
        } catch ( err ) {
            cfx.error( err );
            return false;
        }
        return true;
    }

    /**
     * Run generator
     * @return {Promise<number>}
     */
    async run() {

        // Main arguments
        let source = this._input.args[ 0 ] || '';
        let target = this._input.args[ 1 ] || '';
        if ( this._input.args.length === 1 ) {
            target = source;
            source = '';
        }

        // Request more info output
        this.verbose = this._get_flag_value( '-v' ) || this._get_flag_value( '--verbose' );

        // Deploy example to current directory
        if ( this._get_flag_value( '-x' ) || this._get_flag_value( '--example' ) ) {
            const deployed = await this._deploy_example( target );
            if ( deployed ) {
                cfx.success( 'Deployed example to: ' + ( target.length ? target : 'current directory' ) );
                return 0;
            }
            return 3;
        }

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

        // Limit to given index
        const limit_index = ( this._get_flag_value( '-l' ) || this._get_flag_value( '--limit' ) || '' )
            .split( ',' ).filter( ( v ) => !!v.length );

        // Collect page data
        await this._collect_pages( tree_data.children, limit_index );
        if ( !Object.entries( this._pages ).length ) {
            cfx.error( 'No page data generated' );
            return 2;
        }

        // Show data only
        const show_data = this._get_flag_value( '-o' ) || this._get_flag_value( '--only' );
        if ( show_data ) {
            const save_to = show_data === 'save';
            if ( this.verbose ) {
                cfx.success( ( save_to ? 'Saving' : 'Showing' ) + ' page data for '
                    + ( limit_index.length || 'all' )
                    + ' page' + ( limit_index.length === 1 ? '' : 's' ) );
                if (  limit_index.length ) {
                    cfx.info( ' > ' + limit_index.join( ', ' ) );
                }
            }
            if ( save_to ) {
                await this._write_documents( target, false, this._pages, '.json' );
                const compiled_count = Object.keys( this._pages ).length;
                cfx.success( 'twighouse compile completed for ' + compiled_count + ' page' + ( compiled_count === 1 ? '' : 's' ) );
            } else {
                cfx.log( JSON.stringify( this._pages, null, 2 ) );
                if ( this.verbose ) {
                    cfx.success( 'Total pages: ' + Object.keys( this._pages ).length );
                }
            }

            // End with success
            return 0;
        }

        // Render page templates
        const flag_templates = this._get_flag_value( '-t' ) || this._get_flag_value( '--templates' );
        const path_templates = flag_templates || path.join( source, 'templates' );
        await this._render_pages( path_templates );

        // Write pages to target
        const flag_minify = this._get_flag_value( '-m' ) || this._get_flag_value( '--minify' );
        await this._write_documents( target, flag_minify );

        // End with success
        const rendered_count = Object.keys( this._rendered ).length;
        cfx.success( 'twighouse build completed for ' + rendered_count + ' page' + ( rendered_count === 1 ? '' : 's' ) );
        return 0;
    }
}
