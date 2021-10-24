/**
 * Directive: nav item active state
 * @param {string|Array} items - Item value
 * @param {string} key - Item key
 * @param {Object} parent - Item parent
 * @param {TwigHouseDocument} doc - Document object
 * @param {TwigHouse} twigH - TwigHouse instance
 * @param {string} compare - Property name to compare
 * @param {string} prop - Property name to set true on active
 * @return {void}
 */
module.exports = function navItemActive(
    items,
    key,
    parent,
    doc,
    twigH,
    compare = 'uri',
    prop = 'active'
) {
    compare = compare || 'uri';
    prop = prop || 'active';
    if ( items instanceof Array ) {
        for ( let i = 0; i < items.length; i++ ) {
            if ( items[ i ][ compare ] === doc[ compare ] ) {
                items[ i ][ prop ] = true;
            }
        }
    } else if ( parent[ compare ] === doc[ compare ] ) {
        parent[ prop ] = true;
    }
};
