/**
 * Requires
 */
const path = require( 'path' );
const isInstalledGlobally = require( 'is-installed-globally' );
const { cfx } = require( '@squirrel-forge/node-cfx' );
const pkg = require( path.join( __dirname, '../package.json' ) );
const { FsInterface } = require( '@squirrel-forge/node-util' );

/**
 * Create config
 * @return {Promise<boolean|string>} - Path string if created
 */
async function createConfig() {

    // Project directory relation is always:
    // :/project/node_modules/@squirrel-forge/twighouse/src/
    const project_config = path.resolve( __dirname, '../../../../', '.twighouse' );
    const has_config = await FsInterface.exists( project_config );
    let wrote = false;
    if ( !has_config ) {

        // Attempt to create a blank config
        try {
            wrote = await FsInterface.write( project_config, '{}' );
        } catch ( e ) {
            cfx.log( e.toString() );
        }

        // On success supply the path written to
        if ( wrote === true ) {
            wrote = project_config;
        }
    }
    return wrote;
}

/**
 * Issue install notice
 */
cfx.success( 'Thanks for trying ' + pkg.name + ' ['
    + ( isInstalledGlobally ? 'global' : 'local' ) + ']' );

/**
 * How to run notice
 */
if ( isInstalledGlobally ) {
    cfx.info( 'For help run: [fwhite]twighouse -h or --help' );
} else {
    cfx.info( 'For help run: [fwhite]npx twighouse -h or --help' );
}

/**
 * Create an empty .twighouse config in the project directory
 */
if ( !isInstalledGlobally ) {

    // Might issue an exception message, but should never break ;)
    createConfig().then( ( created ) => {
        if ( created ) {
            cfx.success( 'Created an empty project config at: ' + created );
        }
    } );
}
