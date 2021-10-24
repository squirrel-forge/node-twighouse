/**
 * Requires
 */
const path = require( 'path' );

/**
 * Example data loader
 * @param {string} url - Page data url
 * @param {Array<string>} limit - Limit the collection by reference
 * @param {[string,Object]} data - Page data reference
 * @param {TwigHouse} twigH - TwigHouse instance
 * @return {Promise<void>} - Possibly throws errors in strict mode
 */
module.exports = async function exampleLoader( url, limit, data, twigH ) {
    const { name, dir } = path.parse( url );
    const rel_dir = twigH.fs.relPath( dir, twigH.getPath( 'data', dir[ 0 ] === path.sep ) );
    const ref = path.join( rel_dir, name );

    // Skip if the reference is not within our limit_index
    if ( limit.length && !limit.includes( ref ) ) {
        return null;
    }

    // Create document global data
    const doc = twigH.makeDocument( ref, rel_dir, name );

    // Run plugins data method
    await twigH.plugins.run( 'doc', [ ref, doc, twigH ] );

    // Get data
    const loaded_json = { document : doc };

    // Run plugins data method
    await this.plugins.run( 'data', [ ref, loaded_json, this ] );

    // Set data
    Object.assign( data[ 1 ], loaded_json );
};
