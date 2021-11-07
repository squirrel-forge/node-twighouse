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
    } else if ( items !== null && typeof items === 'object' ) {
        twigH.warn( new twigH.constructor.TwigHouseDirectiveWarning( 'Object property sorting is not available yet.' ), true );
    } else {
        twigH.warn( new twigH.constructor.TwigHouseDirectiveWarning( 'Can\'t sort value of type: ' + typeof items ) );
    }
};
