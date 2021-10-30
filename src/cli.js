/**
 * Requires
 */
const path = require( 'path' );
const copy = require( 'recursive-copy' );
const cfx = require( '@squirrel-forge/node-cfx' ).cfx;
const isUrl = require( './fn/isUrl' );
const CliInput = require( './classes/CliInput' );
const TwigHouse = require( './classes/TwigHouse' );

/**
 * TwigHouse cli application
 * @return {void}
 */
module.exports = async function cli() {

    // Input
    const input = new CliInput();

    // Main arguments
    let source = input.arg( 0 ) || '',
        target = input.arg( 1 ) || '';
    if ( !target.length ) {
        target = source;
        source = '';
    }

    // Cli application options
    const options = input.getFlagsOptions( {

        // Show version
        version : [ '-v', '--version', false, true ],

        // Show config
        config : [ '-y', '--show-config', false, true ],

        // Deploy example
        example : [ '-x', '--example', false, true ],

        // Limit to a specific page path or paths
        limit : [ '-l', '--limit', '', false ],

        // Only output the generated json
        output : [ '-o', '--output-json', false ],

        // Data sources overrides default local read
        data : [ '-c', '--data-source', '', false ],

        // Do not break on any error, disables the default strict if set
        loose : [ '-u', '--loose', null, true ],
    } );

    // Limit option must be an Array
    if ( !( options.limit instanceof Array ) ) {
        options.limit = options.limit.split( ',' )
            .filter( ( v ) => { return !!v.length; } );
    }

    // Data sources option must be an Array
    if ( !( options.data instanceof Array ) ) {
        options.data = options.data.split( ',' )
            .filter( ( v ) => { return !!v.length; } );
    }

    // TwigHouse configuration
    const config = input.getFlagsOptions( {

        // Show more output
        verbose : [ '-i', '--verbose', false, true ],

        // Silent mode prevent all except error output
        silent : [ '-q', '--silent', false, true ],

        // Set data directory
        data : [ '-d', '--data-dir', null ],

        // Set fragments directory
        fragments : [ '-f', '--fragments', null ],

        // Set template directory
        templates : [ '-t', '--templates', null ],

        // Set plugin directory
        plugins : [ '-p', '--plugins', null ],

        // Minify the compiled documents
        minify : [ '-m', '--minify', null ],
    } );

    // Cannot use verbose and silent option together
    if ( config.verbose && config.silent ) {
        if ( !options.loose ) {

            // Exit in strict mode
            cfx.error( 'Cannot use verbose and silent mode at the same time' );
            process.exit( 1 );
        } else {

            // Warn and disable verbose in loose mode
            config.verbose = false;
            cfx.warn( 'Verbose mode disabled, '
                + 'silent mode takes precedence in none strict mode when enabling both options' );
        }
    }

    // Show version
    if ( options.version ) {
        const install_dir = path.resolve( __dirname, '../' );
        let pkg;
        try {
            pkg = require( path.join( install_dir, 'package.json' ) );
        } catch ( e ) {
            cfx.error( e );
            process.exit( 1 );
        }
        cfx.log( pkg.name + '@' + pkg.version );
        if ( config.verbose ) {
            cfx.info( '- Installed at: ' + install_dir );
        }
        process.exit( 0 );
    }

    // Deploy example
    if ( options.example ) {
        try {
            const results = await copy( path.join( this.installDirectory, 'example' ), target );
            if ( results && results.length ) {
                cfx.info( 'Copied ' + results.length + ' example files' );
            }
            process.exit( 0 );
        } catch ( err ) {
            cfx.error( err );
            process.exit( 1 );
        }
    }

    // Construct application
    //  - Set output handler
    //  - Prepare instance
    const twigH = new TwigHouse( cfx );

    // Notify source/cwd in verbose
    if ( !config.silent && config.verbose ) {
        const display_cwd = source.length && isUrl( source ) ?
            source : path.resolve( source );
        cfx.info( 'Working in: ' + display_cwd );
    }

    // Initialize application
    //  - Set options relevant for config loading
    //  - Load source filesystem config if available
    const init_config = {
        verbose : config.verbose,
        silent : config.silent,
        root : source,
    };
    if ( options.loose ) {
        init_config.strict = false;
    }
    await twigH.init( init_config );

    // Set all options
    //  - Overrides any filesystem config values with those options set explicitly
    //  - Only plugins may change the config after this point
    twigH.setConfig( config, true );

    // Set target directory, as of where to write if required
    twigH.setConfig( { target } );

    // Force non strict and ignore fs config if set to loose explicitly
    if ( options.loose ) {
        twigH.setConfig( { strict : false } );
    }

    // Show active config object
    if ( options.config ) {
        cfx.log( 'TwigHouseConfig: ' + JSON.stringify( twigH._config, null, 2 ) );
        process.exit( 0 );
    }

    // Load plugins
    //  - Loads plugins from the plugins directory
    //  - And from the config option TwigHouseConfig.usePlugins
    const plugins = await twigH.prepare();

    // Show plugin hints
    if ( !config.silent && config.verbose ) {
        const plugin_hints = twigH.plugins.hints;
        if ( plugin_hints.length ) {
            cfx.warn( plugin_hints.length + ' plugin hints' );
            for ( let i = 0; i < plugin_hints.length; i++ ) {
                cfx.info( plugin_hints[ i ] );
            }
        }
        cfx.success( 'TwigHouse loaded ' + plugins + ' plugin' + ( plugins === 1 ? '' : 's' ) );
    }

    // If our root is set to an url we want to allow
    // for -c / --data-source option to be partial urls to reduce command length
    if ( isUrl( twigH._config.root ) ) {
        for ( let i = 0; i < options.data.length; i++ ) {
            const value = options.data[ i ];
            if ( !isUrl( value ) && value[ 0 ] !== path.sep ) {
                options.data[ i ] = path.join( twigH._config.root, value );
            }
        }
    }

    // Load source data
    //  - Overrides source path data if set as option
    const loaded = await twigH.load( options.limit, options.data.length ? options.data : null );
    if ( !config.silent && config.verbose ) {
        cfx.success( 'TwigHouse loaded ' + loaded + ' page' + ( loaded === 1 ? '' : 's' ) );
    }

    // Lets show or write the loaded/compiled page data
    if ( options.output ) {
        const save_to = options.output === 'save';

        // Lets notify about the details
        if ( ( !config.silent || save_to ) && config.verbose ) {
            cfx.success( ( save_to ? 'Saving' : 'Showing' ) + ' page data for '
                + ( options.limit.length || 'all' )
                + ' page' + ( options.limit.length === 1 ? '' : 's' ) );
            if (  options.limit.length ) {
                cfx.info( ' > ' + options.limit.join( ', ' ) );
            }
        }
        if ( save_to ) {

            // We want to save our data as a json files structure
            const wrote = await twigH.write( null, 'json' );
            cfx.success( 'twighouse compile completed for ' + wrote + ' page' + ( wrote === 1 ? '' : 's' ) );

        } else {

            // All we want is to show as output
            cfx.log( JSON.stringify( twigH._data, null, 2 ) );
            if ( !config.silent && this.verbose ) {
                cfx.success( 'Total pages: ' + Object.keys( twigH._data ).length );
            }
        }
        process.exit( 0 );
    }

    // Render pages
    const rendered = await twigH.render();
    if ( !config.silent && config.verbose ) {
        cfx.success( 'TwigHouse rendered ' + rendered + ' page' + ( rendered === 1 ? '' : 's' ) );
    }

    // Write html documents to target
    const wrote = await twigH.write();
    cfx.success( 'TwigHouse wrote ' + wrote + ' page' + ( wrote === 1 ? '' : 's' ) );

    // End application
    process.exit( 0 );
};
