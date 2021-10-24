/**
 * Requires
 */
const path = require( 'path' );
const Twig = require( 'twig' );
const minify = require( 'html-minifier' ).minify;
const Core = require( './Core' );
const FsInterface = require( './FsInterface' );
const Plugins = require( './Plugins' );
const isUrl = require( '../fn/isUrl' );
const isPojo = require( '../fn/isPojo' );

/**
 * @typedef {Object} TwigHouseConfig
 * @property {boolean} verbose - Run in verbose mode, default: false
 * @property {boolean} strict - Run in strict mode, default: false
 * @property {boolean} silent - Silent mode will prevent any output and should be used with strict = true
 * @property {string} root - Source directory, default: '',
 * @property {string} data - Data directory, default: 'data'
 * @property {string} fragments : Fragments directory, default: 'fragments'
 * @property {string} plugins : Plugins directory, default: 'plugins'
 * @property {string} templates - Templates directory, default: 'templates'
 * @property {string} target - Target directory, default: 'dist'
 * @property {boolean} resolveFragments - Resolve fragments, default: true
 * @property {string} fragmentProperty - Fragment property name to load from, default: '__fragment'
 * @property {boolean} processDirectives - Process directives while parsing json, default: true
 * @property {boolean} ignoreDirectives - Ignore directives that are not defined, default: true
 * @property {string} directivesProperty - Directives property name to execute from, default: '__directives'
 * @property {string} directivePrefix - Directive method prefix, default: 'directive_'
 * @property {string} defaultTemplate - Default template, default: '__page'
 * @property {string} templateExt - Template file extension, default: '.twig'
 * @property {string} templateProperty - Template property, default: '__template'
 * @property {Array} usePlugins - Plugin module names or paths to load, default: []
 * @property {string} pluginExt - Plugin file extension, default: js
 * @property {boolean} minify - Minify document output
 * @property {string} minifyProperty - Minify options property on page to use, default: '__minify'
 * @property {Object} minifyOptions - Minify plugin options
 */

/**
 * @typedef {Object} TwigHouseDocument
 * @property {string} path - Document path
 * @property {string} dir - Directory relative to root
 * @property {string} slug - Document name
 * @property {string} uri - Document uri
 */

/**
 * @typedef {Function} TwigHousePluginRegister
 * @param {TwigHouse} twigH - TwigHouse instance
 * @return {void}
 */

/**
 * @typedef {Object} TwigHousePluginObject
 * @property {string} __name - Plugin name
 * @property {Array<string>} __methods - Plugin method names to auto assign
 * @property {Function|TwigHousePluginRegister} __register - Method called to allow registering of methods
 */

/**
 * TwigHouse class
 * @class
 * @type {TwigHouse}
 */
class TwigHouse extends Core {

    /**
     * Constructor
     * @constructor
     * @param {boolean} silent - Set true to enable silent mode
     * @param {null|console} cfx - Console or alike object
     */
    constructor( silent = false, cfx = null ) {
        super( silent, cfx );

        /**
         * Version
         * @public
         * @property
         * @type {string}
         */
        this.VERSION = '0.7.3';

        /**
         * Reporting mode
         * @protected
         * @property
         * @type {null|console}
         */
        this._mode = null;

        /**
         * Install location
         * @public
         * @property
         * @type {string} - Install path
         */
        this.installDirectory = path.resolve( __dirname, '../../' );

        /**
         * Default config
         * @protected
         * @property
         * @type {TwigHouseConfig}
         */
        this._config = {

            /** Source config name */
            __configname : '.twighouse',

            /** Verbose mode */
            verbose : false,

            /** Strict mode will break on every error */
            strict : true,

            /** Silent mode will prevent any output and should be used with strict = true */
            silent : false,

            /** Source directories */
            root : '',
            data : 'data',
            fragments : 'fragments',
            plugins : 'plugins',
            templates : 'templates',

            /** Target directory */
            target : 'dist',

            /** Resolve fragments */
            resolveFragments : true,

            /** Fragment property name to load from */
            fragmentProperty : '__fragment',

            /** Process directives while parsing json */
            processDirectives : true,

            /** Ignore directives that are not defined */
            ignoreDirectives : false,

            /** Directives property name to execute from */
            directivesProperty : '__directives',

            /** Directive method prefix */
            directivePrefix : 'directive_',

            /** Default template if no other was found */
            defaultTemplate : '__page',

            /** Template file extension */
            templateExt : '.twig',

            /** Root property to use as template source */
            templateProperty : '__template',

            /** Use plugins, plugin paths to load */
            usePlugins : [],

            /** Plugin file extension to use */
            pluginExt : 'js',

            /** Document extension */
            docExt : '.html',

            /** Minify document output */
            minify : false,

            /** Minify options property on page to use */
            minifyProperty : '__minify',

            /** Minify plugin options */
            minifyOptions : {
                removeComments : true,
                collapseWhitespace : true,
                minifyJS : true,
                minifyCSS : true,
            }
        };

        /**
         * Lock setConfig method
         * @private
         * @property
         * @type {boolean}
         */
        this._lockConfig = false;

        /**
         * File system interface
         * @public
         * @property
         * @type {FsInterface}
         */
        this.fs = null;

        /**
         * Plugins handler
         * @public
         * @property
         * @type {Plugins}
         */
        this.plugins = null;

        /**
         * Loaded pages data
         * @protected
         * @property
         * @type {{name:{}}}
         */
        this._data = {};

        /**
         * Loaded data fragments
         * @protected
         * @property
         * @type {{name:{}}}
         */
        this._fragments = {};

        /**
         * Rendered html pages
         * @protected
         * @property
         * @type {{name:{}}}
         */
        this._rendered = {};

        /**
         * Directive stats
         * @public
         * @property
         * @type {{name:number}}
         */
        this.directiveStats = {};

        /**
         * Builtin directives dictionary
         * @protected
         * @property
         * @type {Array<string>}
         */
        this._directivesInUse = [];
    }

    /**
     * Report
     * @protected
     * @param {string} msg - Error message
     * @param {('error'|'warn')} type - Type of reporting if cfx available
     * @throws Error
     * @return {void}
     */
    _report( msg, type ) {

        // In silent, without strict mode, errors will be swallowed
        if ( this._config.strict ) {
            throw new Error( msg );
        } else if ( this._mode && this._mode[ type ] ) {
            this._mode[ type ]( msg );
        } else if ( !this._config.silent ) {

            // eslint-disable-next-line no-console
            console.warn( '[' + type + '] ' + msg );
        }
    }

    /**
     * Logs to output
     * @protected
     * @param {*} output - Any loggable output
     * @param {('log'|'info'|'success')} type - Type of reporting if cfx available
     * @return {void}
     */
    _log( output, type = 'log' ) {
        if ( this._config.silent ) {

            // We do not want any output at all in silent mode
            return;
        }
        if ( this._cfx && this._cfx[ type ] ) {
            this._cfx[ type ]( output );
        } else {

            // eslint-disable-next-line no-console
            console.log( output );
        }
    }

    /**
     * Set reporting mode
     * @private
     * @return {void}
     */
    _setMode() {

        // Default ignore/swallow errors mode
        this._mode = {
            log : () => {},
            error : () => {},
            info : () => {},
        };

        // Verbose mode
        if ( this._config.verbose ) {
            this._mode = this._cfx;
        }

        // Strict and silent mode overrides all
        if ( this._config.strict || this._config.silent ) {
            this._mode = null;
        }
    }

    /**
     * Set config
     * @public
     * @param {TwigHouseConfig} config - Config object
     * @param {boolean} ignoreNull - Do not set null value options and preserve current
     * @return {void}
     */
    setConfig( config, ignoreNull = false ) {
        if ( this._lockConfig ) {
            this._warn( 'The config is locked' + ( this._config.verbose ?
                ', none of the following values were set:'
                : ', enable verbose mode for the actual value output' )
            );
            if ( this._config.verbose ) {
                this._log( config );
            }
            return;
        }
        if ( isPojo( config ) ) {
            if ( Object.keys( config ).length ) {
                if ( ignoreNull ) {
                    const entries = Object.entries( config );
                    for ( let i = 0; i < entries.length; i++ ) {
                        const [ key, value ] = entries[ i ];
                        if ( value !== null ) {
                            this._config[ key ] = value;
                        }
                    }
                } else {
                    Object.assign( this._config, config );
                }
            } else {
                this._warn( 'Attempting to set config with no values' );
            }
        } else {
            this._error( 'Invalid config argument type: ' + typeof config + ' must be a plain object' );
        }
    }

    /**
     * Initialize
     * @public
     * @param {null|TwigHouseConfig} config - Config object
     * @return {void}
     */
    async init( config = null ) {

        // Set config
        this.setConfig( config );

        // Set reporting mode
        this._setMode();

        // Init fs
        this.fs = new FsInterface( this._config.silent, this._mode );

        // Load config from cwd
        await this._loadConfig();
    }

    /**
     * Load config from src directory
     * @private
     * @return {Promise<void>} - Loads and assigns config if available
     */
    async _loadConfig() {
        const config_path = path.resolve( path.join( this._config.root, this._config.__configname ) );
        const config_exists = await this.fs.exists( config_path );
        if ( config_exists ) {
            const config = await this.fs.readJSON( config_path );
            if ( !config ) {
                this._error( 'Failed to load config from: ' + config_path );
            } else {
                Object.assign( this._config, config );
            }
        } else if ( this._config.verbose ) {
            this._info( 'Could define a config at: ' + config_path );
        }
    }

    /**
     * Enable an internal directive
     * @param {string} name - Directive name
     * @return {void}
     */
    useDirective( name ) {
        const directive_path = path.resolve( path.join( this.installDirectory, 'src', 'directives', name + '.js' ) );
        let directive;
        try {
            directive = require( directive_path );
        } catch ( e ) {
            this._log( e );
            this._error( 'Unknown native directive: ' + name );
            return null;
        }
        if ( typeof directive !== 'function' ) {
            this._error( 'Directive must be a function: ' + name );
            return;
        }
        if ( this._directivesInUse.includes( name ) ) {
            this._warn( 'Directive already in use: ' + name );
            return;
        }
        this._directivesInUse.push( name );
        if ( this._config.verbose ) {
            this._info( 'Using directive: ' + name );
        }
        this.registerDirective( name, directive );
    }

    /**
     * Register a directive
     * @public
     * @param {string} name - Directive name
     * @param {string} fn - Directive function
     * @return {void}
     */
    registerDirective( name, fn ) {
        if ( !this.plugins ) {
            this._error( 'Plugins not defined, too early to register directives' );
            return;
        }
        if ( this.plugins.method( this._config.directivePrefix + name, fn ) ) {
            if ( this._config.verbose ) {
                this._info( 'Registered directive: ' + name );
            }
        }
    }

    /**
     * Load plugins
     * @param {null|Array<string>} plugin_paths - Override or prevent loading plugins from plugin dir with an empty array
     * @return {Promise<number>} - Number of plugins loaded
     */
    async prepare( plugin_paths = null ) {
        let fs_plugins;
        if ( !plugin_paths ) {

            // Only get local plugins if none are set
            const plugin_path = this.getPath( 'plugins' );
            fs_plugins = await this.fs.fileList( plugin_path, this._config.pluginExt );
        }
        const load_plugins = plugin_paths || fs_plugins;
        await this.loadPlugins( load_plugins );
        return Object.keys( this.plugins._p ).length;
    }

    /**
     * Load project data
     * @param {Array<string>} limit_index - Limit the collection by reference
     * @param {null|Array<string>} data_paths - Override or prevent loading data from data dir with an empty array
     * @return {Promise<number>} - Number of page data sources loaded
     */
    async load( limit_index = [], data_paths = null ) {
        let fs_data;
        if ( !data_paths ) {

            // Only get local data if none are set
            const data_path = this.getPath( 'data' );
            fs_data = await this.fs.fileList( data_path, 'json' );
        }
        const load_data = data_paths || fs_data;
        await this.collectPagesData( load_data, limit_index );
        return Object.keys( this._data ).length;
    }

    /**
     * Get path from config
     * @param {('root'|'data'|'fragments'|'plugins'|'templates'|'target')} name - Option name
     * @param {boolean} absolute - Set true to return an absolute path
     * @return {string|null} - Path or null if option name was invalid
     */
    getPath( name = 'root', absolute = false ) {
        const path_options = [ 'root', 'data', 'fragments', 'plugins', 'templates' ];
        let compiled;
        if ( [ 'root', 'target' ].includes( name ) ) {

            // Root and target directories require no path joining
            compiled = this._config[ name ];

        } else if ( path_options.includes( name ) ) {

            // Other paths are nested below root
            compiled = this._config[ name ];
            if ( !isUrl( compiled ) && compiled[ 0 ] !== path.sep ) {
                compiled = path.join( this._config.root, this._config[ name ] );
            }

        } else {
            this._error( 'Unknown path option: ' + name );
            return null;
        }

        // Return path in required mode
        if ( absolute && !isUrl( compiled ) ) {
            return path.resolve( compiled );
        }
        return compiled;
    }

    /**
     * Load plugins from paths
     * @param {Array<string>} plugin_paths - List of plugin paths or modules
     * @return {Promise<void>} - Possibly throws errors in strict mode
     */
    async loadPlugins( plugin_paths = [] ) {
        const load_plugins = [ ...this._config.usePlugins, ...plugin_paths ];

        // Init plugins and load plugins
        this.plugins = new Plugins( [], [], this, this._config.silent, this._mode );
        this.plugins.load( load_plugins );

        // Run twig modify and allow plugins to modify config
        await this.plugins.run( 'twig', [ Twig, this ] );

        // Now we lock the config
        // This only causes errors/warnings to throw when using the setConfig method
        this._lockConfig = true;
    }

    /**
     * Load pages data
     * @param {Array<string>} collection - Paths/reference collection
     * @param {Array<string>} limit_index - Limit the collection elements
     * @return {Promise<void>} - Possibly throws errors in strict mode
     */
    async collectPagesData( collection, limit_index = [] ) {
        for ( let i = 0; i < collection.length; i++ ) {
            let page_data = [ collection[ i ], {} ];
            const args = [ collection[ i ], limit_index, page_data, this ];
            if ( this.plugins.has( 'loader' ) ) {

                // Run all loaders and let them modify the page_data object
                await this.plugins.run( 'loader', args );

            } else {

                // By default we can load from the local or a remote filesystem
                page_data = await this.buildPageData( ...args );
            }

            // Ensure page data content
            if ( page_data instanceof Array && page_data.length
                && typeof page_data[ 0 ] === 'string' && page_data[ 0 ].length
                && typeof page_data[ 1 ] === 'object' && page_data[ 1 ] !== null
                && Object.keys( page_data[ 1 ] ).length
            ) {

                // Save the data for processing
                const [ ref, json ] = page_data;
                this._data[ ref ] = json;

            } else if ( !limit_index.length ) {
                this._warn( 'No page data loaded from: ' + collection[ i ] );
            }
        }
    }

    /**
     * Build page data
     * @param {string} file - File path
     * @param {Array<string>} limit_index - Limit the collection by reference
     * @return {Promise<(string|*)[]|null>} - Null on skip or array with reference and json data
     */
    async buildPageData( file, limit_index ) {
        const { name, dir } = path.parse( file );
        const rel_dir = this.fs.relPath( dir, this.getPath( 'data', dir[ 0 ] === path.sep ) );
        const ref = path.join( rel_dir, name );

        // Skip if the reference is not within our limit_index
        if ( limit_index.length && !limit_index.includes( ref ) ) {
            return null;
        }

        // Create document global data
        const doc = this.makeDocument( ref, rel_dir, name );

        // Run plugins data method
        await this.plugins.run( 'doc', [ ref, doc, this ] );

        // Load page json
        const json = await this.getPageJson( file, doc );

        // Empty json data
        if ( json instanceof Array && !json.length || !Object.keys( json ).length ) {
            this._error( 'Page contains no data: ' + ref );
            return null;
        }

        // Assign document
        json.document = doc;

        // Run plugins data method
        await this.plugins.run( 'data', [ ref, json, this ] );

        // Return reference and data
        return [ ref, json ];
    }

    /**
     * Make page document object
     * @public
     * @param {string} ref - Page reference
     * @param {string} rel_dir - Page relative path
     * @param {string} name - Page name
     * @return {TwigHouseDocument} - TwigHouseDocument object
     */
    makeDocument( ref, rel_dir, name ) {
        return {
            path : ref,
            dir : rel_dir,
            slug : name,
            uri : this._getDocumentUri( rel_dir, name ),
        };
    }

    /**
     * Get document uri
     * @param {string} rel_dir - Relative directory/path
     * @param {string} name - Page name
     * @return {string} - Document uri
     */
    _getDocumentUri( rel_dir, name ) {
        return ( rel_dir.length ? rel_dir + path.sep : '' ) + name + this._config.docExt;
    }

    /**
     * Get page json
     * @param {string} file - Json path to load
     * @param {TwigHouseDocument} doc - Document object
     * @return {Promise<Array|Object>} - Compiled page json
     */
    async getPageJson( file, doc ) {
        let source;
        if ( isUrl( file ) ) {
            source = await this.fs.remoteJSON( file );
        } else {
            source = await this.fs.readJSON( file );
        }
        const compiled = {};
        await this.resolvePageJsonTree( source, compiled, doc );
        return compiled;
    }

    /**
     * Resolve json tree
     * @public
     * @param {Array|Object} source - JSON source
     * @param {Array|Object} compiled - Target reference
     * @param {TwigHouseDocument} doc - Document object
     * @return {Promise<void>} - Possibly throws errors in strict mode
     */
    async resolvePageJsonTree( source, compiled, doc ) {
        const is_array = source instanceof Array;
        if ( is_array || isPojo( source ) ) {

            // If we are resolving fragments and its an object were looking at
            if ( this._config.resolveFragments && !is_array && source[ this._config.fragmentProperty ] ) {
                const fragment = await this._resolveFragment( source[ this._config.fragmentProperty ] );
                if ( fragment ) {
                    await this.resolvePageJsonTree( fragment, compiled, doc );
                } else {
                    compiled.__error = compiled.__error || [];
                    compiled.__error.push( 'Failed to resolve fragment: ' + source[ this._config.fragmentProperty ] );
                    this._error( compiled.__error[ compiled.__error.length - 1 ] );
                }
            }

            // Copy data
            for ( const [ key, value ] of Object.entries( source ) ) {
                if ( value instanceof Array ) {
                    compiled[ key ] = [];
                } else if ( isPojo( value ) ) {
                    compiled[ key ] = {};
                } else if ( key === this._config.fragmentProperty && compiled[ key ] ) {
                    if ( !( compiled[ key ] instanceof Array ) ) {
                        compiled[ key ] = [ compiled[ key ] ];
                    }
                    compiled[ key ].push( value );
                } else {
                    compiled[ key ] = value;
                }
                if ( compiled[ key ] !== value ) {
                    await this.resolvePageJsonTree( value, compiled[ key ], doc );
                }
            }

            // Process directives
            await this.processDirectives( compiled, doc );
        }
    }

    /**
     * Process directives
     * @public
     * @param {Object} compiled - Compiled object
     * @param {TwigHouseDocument} doc - TwigHouseDocument object
     * @return {Promise<void>} - Possibly throws errors in strict mode
     */
    async processDirectives( compiled, doc ) {
        if ( this._config.processDirectives && compiled[ this._config.directivesProperty ] instanceof Array ) {
            const directives = compiled[ this._config.directivesProperty ];
            for ( let i = 0; i < directives.length; i++ ) {
                const [ name, key, ...args ] = directives[ i ].split( ':' );
                const method = this._config.directivePrefix + name;
                if ( !this.plugins.has( method ) ) {

                    // Unregistered directive lets notify and skip along to the next
                    const msg = 'Directive not defined: ' + name;
                    if ( this._config.ignoreDirectives ) {
                        if ( this._config.verbose ) {
                            this._info( msg );
                        }
                    } else {
                        this._warn( msg );
                    }
                    continue;
                }

                // Notify target property not set
                if ( this._config.verbose && typeof compiled[ key ] === 'undefined' ) {
                    this._warn( 'Directive property not defined: ' + name + '@' + key );
                }

                // Run directive methods
                const stats = await this.plugins.run( method, [ compiled[ key ], key, compiled, doc, this, ...args ] );
                if ( !this.directiveStats[ name ] ) {
                    this.directiveStats[ name ] = 0;
                }
                if ( stats ) {
                    this.directiveStats[ name ] += stats;
                }
            }
        }
    }

    /**
     * Resolve a fragment by reference
     * @protected
     * @param {string} name - Fragment reference
     * @return {Promise<null|Array|Object>} - Null on error, json data on success
     */
    async _resolveFragment( name ) {
        if ( !this._fragments[ name ] ) {
            await this._loadFragment( name );
        }
        if ( this._fragments[ name ] ) {
            return JSON.parse( JSON.stringify( this._fragments[ name ] ) );
        }
        return null;
    }

    /**
     * Load a fragment from filesystem
     * @protected
     * @param {string} name - Fragment reference
     * @return {Promise<boolean>} - True on success
     */
    async _loadFragment( name ) {
        const frag_path = path.join( this.getPath( 'fragments' ), name + '.json' );
        let exists = false, json_exists = null;
        if ( isUrl( frag_path ) ) {
            json_exists = await this.fs.remoteJSON( frag_path );
            if ( json_exists && typeof json_exists === 'object' && Object.keys( json_exists ).length ) {
                exists = true;
            }
        } else {
            exists = await this.fs.exists( frag_path );
        }
        if ( exists ) {
            let json;
            if ( json_exists ) {
                json = json_exists;
            } else {
                json = await this.fs.readJSON( frag_path );
            }
            if ( json ) {
                this._fragments[ name ] = json;
                return true;
            }
        }
        return false;
    }

    /**
     * Document data available
     * @public
     * @param {Object} data - Page data
     * @return {boolean} - True if TwigHouseDocument is available
     */
    documentAvailable( data ) {
        if ( data && typeof data.document === 'object' ) {
            const check_str = [ 'path', 'dir', 'slug', 'uri' ];
            for ( let i = 0; i < check_str.length; i++ ) {
                if ( typeof data.document[ check_str[ i ] ] !== 'string' ) {
                    return false;
                }
            }
            return true;
        }
        return false;
    }

    /**
     * Minify html document
     * @private
     * @param {string} doc - Html document
     * @param {Object} data - Page data
     * @return {null|string} - Minified document
     */
    _minify_doc( doc, data ) {
        try {
            return minify( doc, data[ this._config.minifyProperty ] || this._config.minifyOptions );
        } catch ( e ) {
            this._error( e );
        }
        return null;
    }

    /**
     * Write documents
     * @param {null|string} target - Target path or null for config value
     * @param {('html'|'json')} type - Type of data to write
     * @return {Promise<number>} - Number of documents written
     */
    async write( target = null, type = 'html' ) {
        target = target || this.getPath( 'target' );

        // Select page json or compiled html as data source
        const data = type === 'json' ? this._data : this._rendered;

        // Cycle all selected data entries
        let write_count = 0;
        for ( const [ key, value ] of Object.entries( data ) ) {
            const doc_path = path.join( target, key + '.' + type );
            const { dir } = path.parse( doc_path );

            // Ensure directory
            const dir_available = await this.fs.dir( path.resolve( dir ) );
            if ( !dir_available ) {
                this._error( 'Failed to create directory: ' + dir );
                continue;
            }

            // Get output
            let doc = value;
            if ( type === 'html' && ( this._config.minify || this._data[ key ][ this._config.minifyProperty ] ) ) {

                // Run minify if set in config or page has a local configuration
                doc = this._minify_doc( value, this._data[ key ] );

            } else if ( type === 'json' && ( value instanceof Array || isPojo( value ) ) ) {

                // Generate JSON string with indent option
                doc = JSON.stringify( value, null, 2 );
            }

            // Write document and notify if requested
            const wrote = await this.fs.write( doc_path, doc );
            if ( wrote ) {
                write_count++;
                if ( this._config.verbose ) {
                    this._info( 'Wrote: ' + doc_path + ' for page: ' + key );
                }
            }
        }
        return write_count;
    }

    /**
     * Get template path
     * @private
     * @param {string} ref - Template reference
     * @param {Object} data - Page data object
     * @return {Promise<null>} - Possibly throws errors in strict mode
     */
    async _getTemplatePath( ref, data ) {
        if ( !this.documentAvailable( data ) ) {
            this._error( 'Page data must contain a valid document property' );
            return null;
        }

        let available_path = null;
        const tmpl_path = this.getPath( 'templates' );
        const paths = [];

        // Template reference from data object
        if ( data[ this._config.templateProperty ] ) {
            paths.push( path.join( tmpl_path, data[ this._config.templateProperty ] ) );
        }

        // Template reference from document path
        paths.push( path.join( tmpl_path, data.document.path ) );

        // Template from default template option
        paths.push( path.join( tmpl_path, this._config.defaultTemplate ) );

        // Allow plugins to modify template paths
        await this.plugins.run( 'template', [ paths, tmpl_path, ref, data, this ] );

        // Select the first available path
        for ( let i = 0; i < paths.length; i++ ) {
            const src = paths[ i ] + this._config.templateExt;
            let path_exists = false;
            if ( isUrl( src ) ) {

                // Cannot load templates from urls
                path_exists = false;
                this._error( 'Cannot load template from url: ' + src );

            } else {
                path_exists = await this.fs.exists( src );
            }

            // Set available
            if ( path_exists ) {
                available_path = src;
                if ( this._config.verbose ) {
                    this._info( 'Using template: ' + paths[ i ] + this._config.templateExt + ' for page: ' + ref );
                }
                break;
            }

            // Only notify if verbose
            if ( this._config.verbose ) {
                this._info( 'Template not found: ' + paths[ i ] + this._config.templateExt + ' for page: ' + ref );
            }
        }
        return available_path;
    }

    /**
     * Render template
     * @public
     * @param {string} template - Template path
     * @param {Object} data - Template data
     * @param {string} ref - Template reference
     * @return {Promise<string>} - Rendered template
     */
    renderTemplate( template, data, ref ) {
        return new Promise( ( resolve, reject ) => {
            Twig.renderFile( template, data, ( err, html ) => {
                if ( err ) {
                    this._error( 'Template error in: ' + ref );
                    this._error( err );
                    reject( err );
                } else {
                    resolve( html );
                }
            } );
        } );
    }

    /**
     * Render page
     * @public
     * @param {string} ref - Page reference
     * @param {Object} data - Page data
     * @param {string} template - Template path
     * @return {Promise<void>} - Possibly throws errors in strict mode
     */
    async renderPage( ref, data, template ) {
        this._rendered[ ref ] = await this.renderTemplate( template, data, ref );
        await this.plugins.run( 'html', [ ref, this._rendered, this ] );
    }

    /**
     * Render pages
     * @public
     * @return {Promise<number>} - Number of pages rendered
     */
    async render() {
        let render_count = 0;
        for ( const [ key, value ] of Object.entries( this._data ) ) {
            if ( !Object.keys( value ).length ) {

                // Skip along we have no data
                this._error( 'No data available for page: ' + key );
                continue;
            }
            const template = await this._getTemplatePath( key, value );
            if ( !template ) {

                // Skip along if we cannot find a template
                this._error( 'Failed to load any template for page: ' + key );
                continue;
            }

            // Render page
            await this.renderPage( key, value, template );
            render_count++;
        }
        return render_count;
    }
}
module.exports = TwigHouse;
