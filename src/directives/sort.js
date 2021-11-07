/**
 * Requires
 */
const isPojo = require( '../fn/isPojo' );

/**
 * Get property compare function
 * @param {number|string} prop - Property name or index
 * @return {(function(*, *): (number))} - Compare function
 */
function propCompare( prop ) {
    return ( a, b ) => {
        if ( a[ prop ] < b[ prop ] ) return -1;
        if ( a[ prop ] > b[ prop ] ) return 1;
        return 0;
    };
}

/**
 * Sort object properties
 * @param {Object} obj - Object to sort
 * @param {('key'|'value')} mode - Sort by, default: 'key'
 * @param {('asc'|'desc')} direction - Sorting direction, default: 'asc'
 * @param {null|Function} fn - Compare function, default: null
 * @return {void}
 */
function sortObjectProperties( obj, mode = 'key', direction = 'asc', fn = null ) {

    // Key is the first value of entries
    mode = mode === 'key' ? 0 : 1;

    // Sort entries
    const entries = Object.entries( obj );
    entries.sort( fn || propCompare( mode ) );

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
 * @param {string} custom - Custom sorting function name
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
    custom = null,
) {
    if ( prop === 'asc' || prop === 'desc' ) {

        // Empty the prop if its a direction
        direction = prop;
        prop = null;
    }
    let fn = null;
    if ( custom ) {
        fn = twigH.getCompare( custom );
        if ( !fn ) twigH.warn( new twigH.constructor.TwigHouseDirectiveWarning( 'Compare function not defined: ' + custom ) );
    }
    if ( items instanceof Array ) {
        if ( prop ) {

            // Sort objects by property name or custom function
            items.sort( fn || propCompare( prop ) );
        } else {

            // Regular boring sort
            items.sort( fn );
        }

        // Reverse direction
        if ( direction === 'desc' ) {
            items.reverse();
        }
    } else if ( items !== null && isPojo( items ) ) {
        sortObjectProperties( items, !prop || prop === 'key' ? 'key' : 'value', direction, fn );
    } else {
        twigH.warn( new twigH.constructor.TwigHouseDirectiveWarning( 'Can\'t sort value of type: ' + typeof items ) );
    }
};
