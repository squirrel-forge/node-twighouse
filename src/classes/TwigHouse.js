/**
 * Requires
 */
const path = require( 'path' );
const Twig = require( 'twig' );
const minify = require( 'html-minifier' ).minify;
const TwigHouseDocument = require( './TwigHouseDocument' );
const FsInterface = require( './FsInterface' );
const Plugins = require( './Plugins' );
const Exception = require( './Exception' );
const isUrl = require( '../fn/isUrl' );
const isPojo = require( '../fn/isPojo' );

/**
 * @typedef {Object} TwigHouseConfig
 * @property {boolean} verbose - Run in verbose mode, default: false
 * @property {boolean} strict - Run in strict mode, default: true
 * @property {boolean} silent - Silent mode will prevent any output and should be used with strict = true, default: false
 * @property {string} root - Source directory, default: '',
 * @property {string} data - Data directory, default: 'data'
 * @property {string} fragments : Fragments directory, default: 'fragments'
 * @property {string} plugins : Plugins directory, default: 'plugins'
 * @property {string} templates - Templates directory, default: 'templates'
 * @property {string} target - Target directory, default: 'dist'
 * @property {boolean} resolveFragments - Resolve fragments, default: true
 * @property {string} fragmentProperty - Fragment property name to load from, default: '__fragment'
 * @property {'all'|Array<string>} useDirectives - Builtin directives to use, none by default: []
 * @property {boolean} processDirectives - Process directives while parsing json, default: true
 * @property {boolean} ignoreDirectives - Ignore directives that are not defined, default: true
 * @property {string} directivesProperty - Directives property name to execute from, default: '__directives'
 * @property {string} directivePrefix - Directive method prefix, default: 'directive_'
 * @property {string} defaultTemplate - Default template, default: '__page'
 * @property {string} templateExt - Template file extension, default: '.twig'
 * @property {string} templateProperty - Template property, default: '__template'
 * @property {Array<string>} usePlugins - Plugin module names or paths to load, none by default: []
 * @property {string} pluginExt - Plugin file extension, default: js
 * @property {string} docDomain - Document domain used for url, default: ''
 * @property {string} docRoot - Document root used for uri and url, default: '/'
 * @property {string} docOmitIndex - For index files do not include the filename for uri and url, default: true
 * @property {string} docExt - Document extension used for uri and url, default: '.html'
 * @property {boolean} minify - Minify document output
 * @property {string} minifyProperty - Minify options property on page to use, default: '__minify'
 * @property {Object} minifyOptions - Minify plugin options
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
 * TwigHouse exception
 * @class
 */
class TwigHouseException extends Exception {}

/**
 * TwigHouse warning
 * @class
 */
class TwigHouseWarning extends Exception {}

/**
 * TwigHouse class
 * @class
 * @type {TwigHouse}
 */
class TwigHouse {

    /**
     * Constructor
     * @constructor
     * @param {null|console} cfx - Console or alike object
     * @param {boolean} dev - Development mode, default: false
     */
    constructor( cfx = null, dev = false ) {

        /**
         * Console alike reporting object
         * @protected
         * @property
         * @type {console|null}
         */
        this._cfx = cfx;

        /**
         * Version
         * @public
         * @property
         * @type {string}
         */
        this.VERSION = '0.8.4';

        /**
         * Development mode
         * @protected
         * @property
         * @type {boolean}
         */
        this._dev = dev;

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

            /** Builtin directives to use */
            useDirectives : [],

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

            /** Plugin file extension to use for fs loading */
            pluginExt : 'js',

            /** Document domain used for url */
            docDomain : '',

            /** Document root used for uri and url */
            docRoot : '/',

            /** For index files do not include the filename for uri and url */
            docOmitIndex : true,

            /** Document extension used for uri and url */
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
         * Page document objects
         * @protected
         * @property
         * @type {{name:{}}}
         */
        this._docs = {};

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
         * Builtin directives in use
         * @protected
         * @property
         * @type {Array<string>}
         */
        this._directivesInUse = [];

        /**
         * Builtin directives names
         * @protected
         * @property
         * @type {string[]}
         */
        this._builtinDirectives = [ 'setFromDoc', 'isDocValue' ];
    }

    /**
     * Parse exception for output
     * @protected
     * @param {string|Error|Exception} msg - Message or exception instance
     * @param {boolean} noTrace - Do not output trace since it is internal
     * @return {string} - Exception output
     */
    _exceptionAsOutput( msg, noTrace = false ) {

        // We check if its an exception, all other errors will be sent to output unmodified
        if ( msg instanceof Exception ) {
            if ( this._config.verbose && !noTrace ) {

                // In verbose we want to whole stack
                return msg.stack;
            } else {

                // In normal mode we just send the short string representation without the stack
                return msg + '';
            }
        }
        return msg;
    }

    /**
     * Error output
     *  Throw in strict mode or always true
     *  Notify in normal mode
     *  Show full trace in verbose mode
     * @public
     * @param {string|Error|Exception} msg - Message or exception instance
     * @param {boolean} always - Fatal error, always throw
     * @throws {Exception}
     * @return {void}
     */
    error( msg, always = false ) {

        // In strict mode we always throw
        if ( always || this._config.strict ) {
            throw msg;
        }

        // If we are not silent and we have a fitting error logger
        if ( !this._config.silent && this._cfx && typeof this._cfx.error === 'function' ) {
            this._cfx.error( this._exceptionAsOutput( msg ) );
        }
    }

    /**
     * Warning output
     *  Throw in strict mode, always with trace
     *  Notify in normal mode
     *  Show full trace in verbose mode unless suppressed with noTrace
     * @public
     * @param {string|Error|Exception} msg - Message or exception instance
     * @param {boolean} always - Always show warning
     * @param {boolean} noTrace - Do not output trace since it is internal
     * @throws {Exception}
     * @return {void}
     */
    warn( msg, always = false, noTrace = false ) {
        let show = false;
        if ( always || this._config.strict ) {

            // In strict mode we always throw
            if ( this._config.strict ) {
                throw msg;
            }

            // If always is set, but not strict, we wont to show the warning
            show = true;
        } else if ( !this._config.silent && this._cfx && typeof this._cfx.warn === 'function' ) {

            // If we are not silent and we have a fitting warning logger
            show = true;
        }
        if ( show ) {
            this._cfx.warn( this._exceptionAsOutput( msg, noTrace ) );
        }
    }

    /**
     * Report message
     *  Notify if not silent
     *  Unless always
     *  Can show an optional trace if Exception
     *  Type 'success' does a fallback to 'log' if not available
     * @public
     * @param {('log'|'info'|'success')} type - Type of reporting if cfx available
     * @param {string|Exception} msg - Message or exception instance
     * @param {boolean} always - Always show warning
     * @param {boolean} showTrace - Show message trace if its an Exception
     * @return {void}
     */
    _report( type, msg, always = false, showTrace = false ) {
        let show = always;
        if ( !this._config.silent ) {

            // If we are not silent and we have a fitting logger
            show = true;
        }
        if ( show && this._cfx ) {

            // Fallback to log method if not available
            if ( type === 'success' && typeof this._cfx[ type ] !== 'function' ) {
                type = 'log';
            }
            if ( typeof this._cfx[ type ] === 'function' ) {
                this._cfx[ type ]( this._exceptionAsOutput( msg, !showTrace ) );
            }
        }
    }

    /**
     * Log message
     * @public
     * @param {string|Exception} msg - Message or exception instance
     * @param {boolean} always - Always show warning
     * @param {boolean} showTrace - Show message trace if its an Exception
     * @return {void}
     */
    log( msg, always = false, showTrace = false ) {
        this._report( 'log', msg, always, showTrace );
    }

    /**
     * Info message
     * @public
     * @param {string|Exception} msg - Message or exception instance
     * @param {boolean} always - Always show warning
     * @param {boolean} showTrace - Show message trace if its an Exception
     * @return {void}
     */
    info( msg, always = false, showTrace = false ) {
        this._report( 'info', msg, always, showTrace );
    }

    /**
     * Success message
     * @public
     * @param {string|Exception} msg - Message or exception instance
     * @param {boolean} always - Always show warning
     * @param {boolean} showTrace - Show message trace if its an Exception
     * @return {void}
     */
    success( msg, always = false, showTrace = false ) {
        this._report( 'success', msg, always, showTrace );
    }

    /**
     * Set config
     * @public
     * @param {TwigHouseConfig} config - Config object
     * @param {boolean} ignoreNull - Do not set null value options and preserve current
     * @throws {Exception}
     * @return {void}
     */
    setConfig( config, ignoreNull = false ) {
        if ( isPojo( config ) ) {

            // Check locked mode
            if ( this._lockConfig ) {
                const msg = 'The TwigHouse config is locked' +
                    ( this._config.verbose ?
                        ', none of the values were set'
                        : ', enable verbose mode for the actual value output' );
                const previous = this._config.verbose ? JSON.stringify( config, null, 2 ) : '';
                this.warn( new TwigHouseWarning( msg, previous ), true );
                return;
            }

            // Check contents
            if ( Object.keys( config ).length ) {
                if ( ignoreNull ) {
                    const entries = Object.entries( config );
                    for ( let i = 0; i < entries.length; i++ ) {
                        const [ key, value ] = entries[ i ];
                        if ( value !== null && typeof value !== 'undefined' ) {
                            this._config[ key ] = value;
                        }
                    }
                } else {
                    Object.assign( this._config, config );
                }
            } else {
                this.warn( new TwigHouseWarning( 'Attempting to set config with no values' ), false, true );
            }
        } else {
            this.error( new TwigHouseException( 'Invalid config argument type: ' + typeof config + ' must be a plain object' ), true );
        }
    }

    /**
     * Initialize
     * @public
     * @param {null|TwigHouseConfig} config - Config object
     * @throws {Exception}
     * @return {void}
     */
    async init( config = null ) {

        // Set config
        this.setConfig( config );

        // Init fs
        this.fs = new FsInterface();

        // Load config from cwd/source
        if ( typeof this._config.__configname === 'string' && this._config.__configname.length ) {
            await this._loadConfig();
        } else {
            this.error( new TwigHouseException( 'Invalid config value for __configname, must be a possible filename' ), true );
        }
    }

    /**
     * Load config from src directory
     * @private
     * @throws {Exception}
     * @return {Promise<void>} - Loads and assigns config if available
     */
    async _loadConfig() {
        let config_path;

        // In dev mode always load config from current cwd
        if ( this._dev ) {
            config_path = path.resolve( path.join( process.cwd(), this._config.__configname ) );
        }

        // Not an absolute path
        if ( !config_path || config_path[ 0 ] !== path.sep ) {

            // Assumes current cwd if root is an url
            config_path = path.resolve( path.join( isUrl( this._config.root ) ? '' : this._config.root, this._config.__configname ) );
        }
        const config_exists = await this.fs.exists( config_path );
        if ( config_exists ) {
            if ( this._config.verbose ) {
                this.info( 'Reading config from: ' + config_path );
            }
            let config, err;
            try {
                config = await this.fs.readJSON( config_path );
            } catch ( e ) {
                err = e;
            }
            if ( err || !config || typeof config !== 'object' ) {

                // Always fail if invalid object
                this.error( new TwigHouseException( 'Failed to load config from: ' + config_path, err ), true );
            } else {

                // Disallow options
                delete config.__configname;
                delete config.verbose;
                delete config.silent;

                // Assign leftover values
                Object.assign( this._config, config );
            }
        } else if ( this._config.verbose ) {
            this.info( 'Could define a config at: ' + config_path );
        }
    }

    /**
     * Enable an internal directive
     * @param {string} name - Directive name
     * @throws {Exception}
     * @return {void}
     */
    useDirective( name ) {
        const directive_path = path.resolve( path.join( this.installDirectory, 'src', 'directives', name + '.js' ) );
        let directive;
        try {
            directive = require( directive_path );
        } catch ( e ) {

            // Always rethrow
            this.error( new TwigHouseException( 'Unknown native directive: ' + name, e ), true );
        }
        if ( typeof directive !== 'function' ) {

            // Must be a function, we cannot ignore that
            this.error( new TwigHouseException( 'Directive must be a function: ' + name ), true );
        }

        // Check if the native directive is already in use
        if ( this._directivesInUse.includes( name ) ) {
            this.warn( new TwigHouseWarning( 'Directive already in use: ' + name ) );
            return;
        }

        // Add directive and notify
        this._directivesInUse.push( name );
        if ( this._config.verbose ) {
            this.info( 'Using directive: ' + name );
        }
        this.registerDirective( name, directive );
    }

    /**
     * Register builtin directives according to config
     * @public
     * @param {Array<string>|'all'} from - Directive list to load
     * @return {void}
     */
    registerBuiltinDirectives( from = null ) {
        from = from || this._config.useDirectives;
        if ( from === 'all' ) {

            // Use all defined builtins
            from = this._builtinDirectives;
        }
        for ( let i = 0; i < from.length; i++ ) {
            this.useDirective( from[ i ] );
        }
    }

    /**
     * Register a directive
     * @public
     * @param {string} name - Directive name
     * @param {string} fn - Directive function
     * @throws {Exception}
     * @return {void}
     */
    registerDirective( name, fn ) {
        if ( !this.plugins ) {

            // Always throw since we really cant set anything yet
            this.error( new TwigHouseException( 'Plugins not defined, too early to register directives' ), true );
        }
        if ( this.plugins.method( this._config.directivePrefix + name, fn ) ) {
            if ( this._config.verbose ) {
                this.info( 'Registered directive: ' + name );
            }
        }
    }

    /**
     * Get document for reference
     * @param {string} ref - Page reference
     * @return {null|TwigHouseDocument} - Page document
     */
    getDoc( ref ) {
        return this._docs[ ref ] || null;
    }

    /**
     * Get data for reference
     * @param {string} ref - Page reference
     * @return {null|Object} - Page data
     */
    getData( ref ) {
        return this._data[ ref ] || null;
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

        // Always use provided argument over the default filesystem list
        const load_plugins = plugin_paths || fs_plugins;
        await this.loadPlugins( load_plugins );

        // Return how many plugins were loaded
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
     * @throws {Exception}
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
            this.error( new TwigHouseException( 'Unknown path option: ' + name ) );
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

        // Init plugins
        this.plugins = new Plugins( this, this._config.strict );

        // Now we lock the config and prevent plugins from setting any values
        // This only causes errors/warnings to throw when using the setConfig method
        this._lockConfig = true;

        // Use builtin directives before loading plugins
        // this ensures there are no collisions of internals,
        // but any plugin that attempts to register a taken name will show an error
        this.registerBuiltinDirectives();

        // Load plugins
        this.plugins.load( load_plugins );

        // Run twig modify and allow plugins to modify config
        await this.plugins.run( 'twig', [ Twig, this ] );
    }

    /**
     * Prepare document objects
     * @param {Array<string>} collection - Paths/reference collection
     * @return {Promise<Array<string>>} - References matching the collection
     */
    async prepareDocuments( collection ) {
        const references = [];
        for ( let i = 0; i < collection.length; i++ ) {
            const twHdoc = new TwigHouseDocument( collection[ i ], this );
            this._docs[ twHdoc.ref ] = twHdoc;
            references.push( twHdoc.ref );

            // Run plugins data method
            await this.plugins.run( 'doc', [ twHdoc.ref, twHdoc, this ] );
        }
        return references;
    }

    /**
     * Load pages data
     * @param {Array<string>} collection - Paths/reference collection
     * @param {Array<string>} limit_index - Limit the collection elements
     * @throws {Exception}
     * @return {Promise<void>} - Possibly throws errors in strict mode
     */
    async collectPagesData( collection, limit_index = [] ) {
        const refs = await this.prepareDocuments( collection );
        if ( !this._config.silent && this._config.verbose ) {
            this.success( 'Loaded ' + refs.length + ' reference document' + ( refs.length !== 1 ? 's' : '' ) );
        }
        for ( let i = 0; i < collection.length; i++ ) {
            let page_data = [ collection[ i ], {} ];
            if ( this.plugins.has( 'loader' ) ) {

                // Run all loaders and let them modify the page_data object
                await this.plugins.run( 'loader', [ collection[ i ], limit_index, page_data, refs[ i ], this ] );

            } else {

                // By default we can load from the local or a remote filesystem
                page_data = await this.buildPageData( collection[ i ], limit_index, this._docs[ refs[ i ] ] );
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

                // We dont have a limit set, so we need to warn for possible empty data
                this.warn( new TwigHouseWarning( 'No page data loaded from: ' + collection[ i ] ), false, true );
            }
        }
    }

    /**
     * Build page data
     * @param {string} file - File path
     * @param {Array<string>} limit_index - Limit the collection by reference
     * @param {TwigHouseDocument} doc - Document object
     * @throws {Exception}
     * @return {Promise<(string|*)[]|null>} - Null on skip or array with reference and json data
     */
    async buildPageData( file, limit_index, doc ) {

        // Skip if the reference is not within our limit_index
        if ( limit_index.length && !limit_index.includes( doc.ref ) ) {
            return null;
        }

        // Load page json
        let json;
        try {
            json = await this.getPageJson( file, doc );
        } catch ( e ) {
            this.error( new TwigHouseException( 'Page data has errors: '
                + ( this._config.verbose ? doc.source : doc.ref ), e ) );
        }

        // Empty json data
        if ( !json || !isPojo( json ) || !Object.keys( json ).length ) {
            this.error( new TwigHouseException( 'Page contains no data: '
                + ( this._config.verbose ? doc.source : doc.ref ) ) );
            return null;
        }

        // Assign document
        json.document = doc;

        // Run plugins data method
        await this.plugins.run( 'data', [ doc.ref, json, this ] );

        // Return reference and data
        return [ doc.ref, json ];
    }

    /**
     * Get page json
     * @param {string} file - Json path to load
     * @param {TwigHouseDocument} doc - Document object
     * @throws {FsInterfaceException}
     * @return {Promise<Array|Object>} - Compiled page json
     */
    async getPageJson( file, doc ) {
        let source;
        try {
            if ( isUrl( file ) ) {
                source = await this.fs.remoteJSON( file );
            } else {
                source = await this.fs.readJSON( file );
            }
        } catch ( e ) {
            this.error( new TwigHouseException( 'Failed to read page JSON at: ' + file, e ) );
            return null;
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
     * @throws {Exception}
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

                    // Set an error array on the current object
                    compiled.__error = compiled.__error || [];
                    compiled.__error.push( 'Failed to resolve fragment: ' + source[ this._config.fragmentProperty ] );

                    // Silence, notify or throw in strict mode
                    this.error( new TwigHouseException( compiled.__error[ compiled.__error.length - 1 ] ) );
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
     * @throws {Exception}
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
                    if ( this._config.ignoreDirectives ) {
                        if ( this._config.verbose ) {
                            this.info( 'Skipping undefined directive: ' + name );
                        }
                    } else {
                        this.warn( new TwigHouseWarning( 'Directive not defined: ' + name ), false, true );
                    }
                    continue;
                }

                // Notify target property not set
                if ( typeof compiled[ key ] === 'undefined' ) {
                    const notDefined = 'Directive property not defined: ' + name + '@' + key
                        + ' in document: ' + doc.ref;
                    this.warn( new TwigHouseWarning( notDefined ), false, true );
                }

                // Run directive methods
                const plugin_args = [ compiled[ key ], key, compiled, doc, this, ...args ];
                let stats;
                try {
                    stats = await this.plugins.run( method, plugin_args );
                } catch ( e ) {
                    this.error( new TwigHouseException( 'Directive "' + name + '" failed in: ' + doc.ref, e ) );
                }
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
        return data && data.document instanceof TwigHouseDocument;
    }

    /**
     * Minify html document
     * @private
     * @param {string} doc - Html document
     * @param {Object} data - Page data
     * @throws {Exception}
     * @return {null|string} - Minified document
     */
    _minify_doc( doc, data ) {
        try {
            return minify( doc, data[ this._config.minifyProperty ] || this._config.minifyOptions );
        } catch ( e ) {
            this.error( new TwigHouseException( 'Failed to minify document: ' + data.document.ref, e ), true );
        }
        return null;
    }

    /**
     * Write documents
     * @param {null|string} target - Target path or null for config value
     * @param {('html'|'json')} type - Type of data to write
     * @throws {Exception}
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
            if ( !dir_available || dir_available instanceof Exception ) {
                this.error( new TwigHouseException( 'Failed to create directory: ' + dir, dir_available ) );
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
            if ( wrote instanceof Exception ) {
                this.error( wrote );
            }
            if ( wrote ) {
                write_count++;
                if ( this._config.verbose ) {
                    this.info( 'Wrote: ' + doc_path + ' for page: ' + key );
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
     * @throws {Exception}
     * @return {Promise<null>} - Possibly throws errors in strict mode
     */
    async _getTemplatePath( ref, data ) {
        if ( !this.documentAvailable( data ) ) {
            this.error( new TwigHouseException( 'Page data must contain a valid document property' ) );
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
        paths.push( path.join( tmpl_path, data.document.dir ) );

        // Template from default template option
        paths.push( path.join( tmpl_path, this._config.defaultTemplate ) );

        // Allow plugins to modify template paths
        await this.plugins.run( 'template', [ paths, tmpl_path, ref, data, this ] );

        // Select the first available path
        for ( let i = 0; i < paths.length; i++ ) {
            const src = paths[ i ] + this._config.templateExt;
            let path_exists = false;
            if ( isUrl( src ) ) {

                // Cannot load templates from urls, always fatal
                this.error( new TwigHouseException( 'Cannot load template from url: ' + src ), true );

            } else {
                path_exists = await this.fs.exists( src );
            }

            // Set available
            if ( path_exists ) {
                available_path = src;
                if ( this._config.verbose ) {
                    this.info( 'Using template: ' + paths[ i ] + this._config.templateExt + ' for page: ' + ref );
                }
                break;
            }

            // Only notify if verbose
            if ( this._config.verbose ) {
                this.info( 'Template not found: ' + paths[ i ] + this._config.templateExt + ' for page: ' + ref );
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
     * @throws {Exception}
     * @return {Promise<string>} - Rendered template
     */
    renderTemplate( template, data, ref ) {
        return new Promise( ( resolve, reject ) => {
            Twig.renderFile( template, data, ( err, html ) => {
                if ( err ) {
                    const twex = new TwigHouseException( 'Template error in: ' + ref, err );
                    this.error( twex );
                    reject( twex );
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
     * @throws {Exception}
     * @return {Promise<number>} - Number of pages rendered
     */
    async render() {
        let render_count = 0;
        for ( const [ key, value ] of Object.entries( this._data ) ) {
            if ( !Object.keys( value ).length ) {

                // Skip along we have no data
                this.error( new TwigHouseException( 'No data available for page: ' + key ) );
                continue;
            }
            const template = await this._getTemplatePath( key, value );
            if ( !template ) {

                // Skip along if we cannot find a template
                this.error( new TwigHouseException( 'Failed to load any template for page: ' + key ) );
                continue;
            }

            // Render page
            await this.renderPage( key, value, template );
            render_count++;
        }
        return render_count;
    }
}

// Export TwigHouseException as static property constructor
TwigHouse.TwigHouseException = TwigHouseException;
module.exports = TwigHouse;
