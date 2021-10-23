/**
 * Requires
 */
const path = require( 'path' );
const copy = require( 'recursive-copy' );
const cfx = require( '@squirrel-forge/node-cfx' ).cfx;
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
        version : [ '-v', '--version' ],

        // Deploy example
        example : [ '-x', '--example' ],

        // Limit to a specific page path or paths
        limit : [ '-l', '--limit', '' ],

        // Only output the generated json
        output : [ '-o', '--output-json' ],
    } );

    // Limit option must be an Array
    if ( !( options.limit instanceof Array ) ) {
        options.limit = options.limit.split( ',' )
            .filter( ( v ) => { return !!v.length; } );
    }

    // TwigHouse configuration
    const config = input.getFlagsOptions( {

        // Show more output
        verbose : [ '-i', '--verbose', false ],

        // Break on any error
        strict : [ '-s', '--strict', false ],

        // Set data directory
        data : [ '-d', '--data-dir' ],

        // Set fragments directory
        fragments : [ '-f', '--fragments-dir' ],

        // Set template directory
        templates : [ '-t', '--templates-dir' ],

        // Set plugin directory
        plugins : [ '-p', '--plugins-dir' ],

        // Minify the compiled documents
        minify : [ '-m', '--minify' ],
    } );

    // Show version
    if ( options.version ) {
        const install_dir = path.resolve( __dirname, '../' );
        let pkg;
        try {
            pkg = require( path.join( install_dir, 'package.json' ) );
        } catch ( e ) {
            cfx.error( e );
            return;
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
    if ( config.verbose ) {
        cfx.info( 'Working in: ' + path.resolve( source ) );
    }

    // Initialize application
    //  - Set options relevant for config loading
    //  - Load source filesystem config if available
    await twigH.init( {
        verbose : !!config.verbose,
        strict : !!config.strict,
        root : source,
    } );

    // Set all options
    //  - Overrides any filesystem config values with those options set explicitly
    //  - Only plugins may change the config after this point
    twigH.setConfig( config, true );

    // Set target directory, as of where to write if required
    twigH.setConfig( { target } );

    // Load plugins and source data
    //  - Loads plugins from the plugins directory
    //  - And from the config option TwigHouseConfig.usePlugins
    await twigH.load( options.limit );

    // Let show or write the loaded/compiled page data
    if ( options.output ) {
        const save_to = options.output === 'save';

        // Lets notify about the details
        if ( config.verbose ) {
            cfx.success( ( save_to ? 'Saving' : 'Showing' ) + ' page data for '
                + ( options.limit.length || 'all' )
                + ' page' + ( options.limit.length === 1 ? '' : 's' ) );
            if (  options.limit.length ) {
                cfx.info( ' > ' + options.limit.join( ', ' ) );
            }
        }
        if ( save_to ) {

            // We want to save our data as a json files structure
            const wrote = await twigH.writeDocuments( null, 'json' );
            cfx.success( 'twighouse compile completed for ' + wrote + ' page' + ( wrote === 1 ? '' : 's' ) );

        } else {

            // All we want is to show as output
            cfx.log( JSON.stringify( twigH._data, null, 2 ) );
            if ( this.verbose ) {
                cfx.success( 'Total pages: ' + Object.keys( twigH._data ).length );
            }
        }
        process.exit( 0 );
    }

    // Render pages
    const rendered = await twigH.renderPages();
    if ( config.verbose ) {
        cfx.info( 'twighouse rendered ' + rendered + ' page' + ( rendered === 1 ? '' : 's' ) );
    }

    // Write html documents to target
    const wrote = await twigH.writeDocuments();
    cfx.success( 'twighouse rendered and wrote ' + wrote + ' page' + ( wrote === 1 ? '' : 's' ) );

    // End application
    process.exit( 0 );
};
