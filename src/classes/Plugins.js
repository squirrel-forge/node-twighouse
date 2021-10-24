/**
 * Requires
 */
const path = require( 'path' );
const Core = require( './Core' );
const isPojo = require( '../fn/isPojo' );

/**
 * Plugins handler
 * @class
 * @type {Plugins}
 */
class Plugins extends Core {

    /**
     * Constructor
     * @constructor
     * @param {Array<string>} allowed - Allowed method names
     * @param {Array<string>} paths - Any number of plugin paths to load
     * @param {null|Object} context - Context object parsed to register
     * @param {null|console} cfx - Console or alike object
     */
    constructor( allowed = [], paths = [], context = null, cfx = null ) {
        super( cfx );

        /**
         * Context
         * @private
         * @type {null|Object}
         */
        this._c = context;

        /**
         * Plugin objects
         * @private
         * @type {{name: Object}}
         */
        this._p = {};

        /**
         * Registered methods
         * @private
         * @type {{name: [<Function>]}}
         */
        this._m = {};

        /**
         * List of available method names
         * @private
         * @type {string[]}
         */
        this._a = [ ...allowed ];

        // Load plugins if provided
        if ( paths.length ) {
            this.load( paths );
        }
    }

    /**
     * Register a plugin
     * @public
     * @param {string} name - Plugin name
     * @param {Object} plugin - Plugin object or instance
     * @param {boolean} was_constructor - True if the plugin was constructed via class/function
     * @return {void}
     */
    register( name, plugin, was_constructor ) {
        if ( this._p[ name ] ) {
            this._error( 'Plugin name "' + name + '" already loaded' );
        } else {
            this._p[ name ] = plugin;

            // Allow non class plugin to register methods
            if ( !was_constructor ) {

                let loaded_something = false;
                if ( typeof plugin.__register === 'function' ) {

                    // Let the plugin decide what to register
                    plugin.__register( this._c || this );
                    loaded_something = true;

                }
                if ( this._a.length || plugin.__methods && plugin.__methods.length ) {

                    // We know what method names could be called
                    const names = plugin.__methods ? plugin.__methods : this._a;
                    for ( let i = 0; i < names.length; i++ ) {
                        const method = names[ i ];

                        // Register if method available
                        if ( typeof plugin[ method ] === 'function' ) {
                            this.method( method, plugin[ method ] );
                            loaded_something = true;
                        }
                    }
                }

                // We did not load anything, lets remove the plugin and shout
                if ( !loaded_something ) {
                    delete this._p[ name ];
                    this._warn( 'Removed plugin "' + name + '" that assigned no methods' );
                }
            }
        }
    }

    /**
     * Plugin/s exist/s
     * @public
     * @param {null|string} plugin - Plugin name
     * @return {boolean} - True if loaded or plugins available
     */
    exists( plugin = null ) {
        if ( plugin === null ) {
            return !!Object.keys( this._p ).length;
        }
        return !!this._p[ plugin ];
    }

    /**
     * Load plugins
     * @public
     * @param {Array<string>} paths - Array of paths
     * @return {void}
     */
    load( paths = [] ) {
        for ( let i = 0; i < paths.length; i++ ) {

            // Attempt to load
            const plugin_path = path.resolve( paths[ i ] );
            const Plugin = require( plugin_path );

            // We require a constructor, instance or object
            const to = typeof Plugin;
            const is_function = to === 'function';
            const is_object = Plugin !== null && to === 'object';

            // Error and continue to next index
            if ( !is_function && !is_object ) {
                this._error( 'Invalid plugin type at: ' + plugin_path );
                continue;
            }

            // A plain object with a set of methods and a __name property
            const is_pojo = is_object && isPojo( Plugin );
            if ( is_pojo && typeof Plugin.__name !== 'string' || !Plugin.__name.length ) {
                this._error( 'Plugin plain object requires a __name property with a non empty string to identify at: ' + plugin_path );
                continue;
            }

            // Get name and object/instance
            let name = null, obj = Plugin;
            if ( is_pojo ) {

                // Register the plain object
                name = Plugin.__name;

            } else if ( is_object ) {

                // Register class instance
                name = Plugin.constructor.name;

            } else if ( is_function ) {

                // Construct instance
                name = Plugin.name;
                obj = new Plugin( this._c || this );
            }

            // Register
            if ( name && obj ) {
                this.register( name, obj, is_function );
            } else {
                this._error( 'Failed to load plugin at: ' + plugin_path );
            }
        }
    }

    /**
     * Register plugin method
     * @public
     * @param {string} name - Method name
     * @param {Function} fn - Plugin function
     * @return {void}
     */
    method( name, fn ) {

        if ( typeof fn !== 'function' ) {

            // Must be a callable function
            this._error( 'Method "' + name + '" must be a callable function' );

        } else if ( this._a.length && !this._a.includes( name ) ) {

            // Method names are limited if defined during construction
            this._error( 'Cannot set unknown plugin method: ' + name );

        } else {

            // We require an array for multiple methods
            if ( !this._m[ name ] ) {
                this._m[ name ] = [];
            }
            this._m[ name ].push( fn );
        }
    }

    /**
     * Method available
     * @public
     * @param {string} name - Method name
     * @return {boolean} - True if method available
     */
    has( name ) {
        const m = this._m[ name ];
        return m && m.length;
    }

    /**
     * Call plugin methods
     * @public
     * @param {string} name - Method name
     * @param {Array} args - Optional arguments
     * @return {Promise<boolean>} - True if at least one method was run
     */
    async run( name, args = [] ) {
        const methods = this._m[ name ];

        // Skip with nothing to call
        if ( !methods || !methods.length ) {
            return false;
        }

        // Attempt to run methods
        for ( let i = 0; i < methods.length; i++ ) {
            try {
                await methods[ i ]( ...args );
            } catch ( e ) {
                this._error( '[' + methods[ i ].name + '@' + name + '] ' + e );
            }
        }
        return true;
    }
}
module.exports = Plugins;
