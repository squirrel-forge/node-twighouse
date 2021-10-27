/**
 * Example data loader
 * @param {string} url - Page data url
 * @param {Array<string>} limit - Limit the collection by reference
 * @param {[string,Object]} data - Page data reference
 * @param {string} ref - Document reference
 * @param {TwigHouse} twigH - TwigHouse instance
 * @return {Promise<void>} - Possibly throws errors in strict mode
 */
module.exports = async function exampleLoader( url, limit, data, ref, twigH ) {

    // Skip if the reference is not within our limit_index
    if ( limit.length && !limit.includes( ref ) ) {
        return null;
    }

    // Get data
    const page = {};

    // Assign some random data
    let i = 10;
    while ( i ) {
        page[ Math.random().toString( 36 ).substring( 2, 12 ) ] = '#' + i;
        i--;
    }

    // Set the document
    page.document = twigH.getDoc( ref );

    // Run plugins data method
    await twigH.plugins.run( 'data', [ ref, page, this ] );

    // Set data
    Object.assign( data[ 1 ], page );
};
