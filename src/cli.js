/**
 * Requires
 */
const path = require( 'path' );
const copy = require( 'recursive-copy' );
const cfx = require( '@squirrel-forge/node-cfx' ).cfx;
const TwigHouse = require( './classes/TwigHouse' );
const CliInput = require( './classes/CliInput' );
const isUrl = require( './fn/isUrl' );

/**
 * Set config values from interactive answers
 * @param {Object} config - Config object
 * @param {Object} answers - Answers object
 * @return {void}
 */
function setFromInteractive( config, answers ) {
    const answer_entries = Object.entries( answers );
    for ( let i = 0; i < answer_entries.length; i++ ) {
        const [ name, value ] = answer_entries[ i ];
        switch ( typeof value ) {
        case 'string' :
        case 'boolean' :
            config[ name ] = value;
        }
    }
}

/**
 * TwigHouse cli application
 * @return {void}
 */
module.exports = async function cli() {

    // Input
    const input = new CliInput( cfx );

    // Main arguments
    let source = input.arg( 0 ) || '',
        target = input.arg( 1 ) || '';
    if ( !target.length ) {
        target = source;
        source = '';
    }

    // Cli application options
    const options = input.getFlagsOptions( {

        // Development mode
        dev : [ '', '--dev', false, true ],

        // Show version
        version : [ '-v', '--version', false, true ],

        // Show config
        config : [ '-y', '--show-config', false, true ],

        // Deploy example
        example : [ '-x', '--example', false, true ],

        // Ask for input and replace all other input options and config
        ask : [ '-a', '--interactive', false, true ],

        // Limit to a specific page path or paths
        limit : [ '-l', '--limit', '', false ],

        // Only output the generated json, set to 'save' to save files to target
        output : [ '-o', '--output-json', false ],

        // Data sources overrides default local read
        data : [ '-c', '--data-source', '', false ],

        // Do not break on any error, disables the default strict if set
        loose : [ '-u', '--loose', null, true ],
    } );

    // Checks for ask mode
    if ( options.ask ) {

        // Should not define any arguments or flags when in interactive mode
        if ( input.hasArgs() > 0 || input.hasFlags() > 1 ) {
            cfx.error( 'Do not specify any arguments or options when using interactive mode!' );
            process.exit( 1 );
        }

        // Check silent mode should not be used with interactive
        const check_silent = input.getFlagsOptions( { is : [ '-q', '--silent', false, true ] } );
        if ( check_silent.is ) {
            cfx.error( 'Cannot run interactive and silent at the same time!' );
            process.exit( 1 );
        }

        // Get answers for arguments
        let answers = await input.ask( {
            source : { question : 'Specify source path or url: (skip uses current working directory)' },
            target : { question : 'Specify target path: (skip uses current working directory)' },
        } );
        source = answers.source || '';
        target = answers.target || '';

        // Get answers to cli options
        answers = await input.ask( {
            version : { question : 'Show version? (yes/no)', is_bool : true, last : true },
            config : { question : 'Show loaded config settings? (yes/no)', is_bool : true, last : true },
            example : { question : 'Deploy example? (yes/no)', is_bool : true, last : true },
            limit : { question : 'Filter pages? (reference or comma separated list)' },
            output_bool : { question : 'Output JSON? (yes/no)', is_bool : true },
            output_save : { question : 'Write JSON? (save/skip)', validate : ( v ) => { return v === 'save'; } },
            data : { question : 'Specify data sources? (path, uri or url or comma separated list)' },
            loose : { question : 'Run in loose mode? (yes/no)', is_bool : true },
        } );

        // Translate output answers to option name and remove source values
        answers.output = answers.output_save === 'save' ? 'save' : answers.output_bool;
        delete answers.output_bool;
        delete answers.output_save;

        // Apply to options object
        setFromInteractive( options, answers );
    }

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

    // Get answers to twighouse config
    if ( options.ask && !options.example ) {
        const answers = await input.ask( {
            verbose : { question : 'Run in verbose mode? (yes/no)', is_bool : true, last : options.version || null },
            data : { question : 'Data directory? (path, uri or url)' },
            fragments : { question : 'Fragments directory? (path, uri or url)' },
            templates : { question : 'Templates directory? (path, uri or url)' },
            plugins : { question : 'Plugins directory? (path, uri or url)' },
            minify : { question : 'Minify html output? (yes/no)', is_bool : true },
        } );

        // Apply to config object
        setFromInteractive( config, answers );
    }

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

    // Construct application
    //  - Set output handler
    //  - Prepare instance
    const twigH = new TwigHouse( cfx, options.dev );

    // Deploy example
    if ( options.example ) {
        try {
            const results = await copy( path.join( twigH.installDirectory, 'example' ), target );
            if ( results && results.length ) {
                cfx.success( 'Copied ' + results.length + ' example files' );
                process.exit( 0 );
            } else {
                cfx.error( 'Did not copy any example files' );
                process.exit( 1 );
            }
        } catch ( err ) {
            cfx.error( err );
            process.exit( 1 );
        }
    }

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

    // Notify strict mode
    if ( twigH._config.strict && twigH._config.verbose ) {
        cfx.warn( 'Running in strict mode!' );
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

            // Remove known circular references
            const data_entries = Object.entries( twigH._data );
            for ( let i = 0; i < data_entries.length; i++ ) {
                const [ , data ] = data_entries[ i ];
                delete data.document._twigH;
            }

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
