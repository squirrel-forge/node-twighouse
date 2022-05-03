/**
 * Requires
 */
const path = require( 'path' );
const { FsInterface } = require( '@squirrel-forge/node-util' );

/**
 * Directive: load text from TwigHouse install
 * @param {string} target - Target path to load
 * @param {string} key - Item key
 * @param {Object} parent - Item parent
 * @param {TwigHouseDocument} doc - Document object
 * @param {TwigHouse} twigH - TwigHouse instance
 * @return {Promise<void>} - Possibly throws errors in strict mode
 */
module.exports = async function exampleDirectiveAsync( target, key, parent, doc, twigH ) {
    const text_path = path.join( twigH.installDirectory, target );
    parent[ key ] = await FsInterface.readText( text_path );
    if ( twigH._config.verbose ) {
        const current_count = twigH.directiveStats[ 'loadFromTwigHouse' ] || 0;
        twigH.info( 'ExamplePlugin Directive [loadFromTwigHouse] >>> Total calls: ' + current_count );
    }
};
