/**
 * Requires
 */
const isPojo = require( '../fn/isPojo' );

/**
 * Sort object properties
 * @param {Object} obj - Object to sort
 * @param {('key'|'value')} mode - Sort by, default: 'key'
 * @param {('asc'|'desc')} direction - Sorting direction, default: 'asc'
 * @return {void}
 */
function sortObjectProperties( obj, mode = 'key', direction = 'asc' ) {

    // Key is the first value of entries
    mode = mode === 'key' ? 0 : 1;

    // Sort entries
    const entries = Object.entries( obj );
    entries.sort( ( a, b ) => {
        if ( a[ mode ] < b[ mode ] ) return -1;
        if ( a[ mode ] > b[ mode ] ) return 1;
        return 0;
    } );

    // Reverse direction
    if ( direction === 'desc' ) {
        entries.reverse();
    }

    // Set values
    for ( let i = 0; i < entries.length; i++ ) {
        const [ k, v ] = entries[ i ];
        delete obj[ k ];
        obj[ k ] = v;
    }
}

/**
 * Directive: sort
 * @param {string|Array} items - Item value
 * @param {string} key - Item key
 * @param {Object} parent - Item parent
 * @param {TwigHouseDocument} doc - Document object
 * @param {TwigHouse} twigH - TwigHouse instance
 * @param {string} prop - Sorting property for objects, default: null
 * @param {string} direction - Sorting direction, default: 'asc'
 * @return {void}
 */
module.exports = function sort(
    items,
    key,
    parent,
    doc,
    twigH,
    prop = null,
    direction = 'asc',
) {
    if ( prop === 'asc' || prop === 'desc' ) {

        // Empty the prop if its a direction
        direction = prop;
        prop = null;
    }
    if ( items instanceof Array ) {
        if ( prop ) {

            // Sort objects by property name
            items.sort( ( a, b ) => {
                if ( a[ prop ] < b[ prop ] ) return -1;
                if ( a[ prop ] > b[ prop ] ) return 1;
                return 0;
            } );
        } else {

            // Regular boring sort
            items.sort();
        }

        // Reverse direction
        if ( direction === 'desc' ) {
            items.reverse();
        }
    } else if ( items !== null && isPojo( items ) ) {
        sortObjectProperties( items, !prop || prop === 'key' ? 'key' : 'value', direction );
    } else {
        twigH.warn( new twigH.constructor.TwigHouseDirectiveWarning( 'Can\'t sort value of type: ' + typeof items ) );
    }
};
