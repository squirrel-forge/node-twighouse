/**
 * Directive: is document value state
 * @param {string|Array} items - Item value
 * @param {string} key - Item key
 * @param {Object} parent - Item parent
 * @param {TwigHouseDocument} doc - Document object
 * @param {TwigHouse} twigH - TwigHouse instance
 * @param {string} compare - Property name to compare, default: 'uri'
 * @param {string} prop - Property name to set, default: 'active'
 * @param {string} value - Value to set, default: true
 * @return {void}
 */
module.exports = function isDocValue(
    items,
    key,
    parent,
    doc,
    twigH,
    compare = 'uri',
    prop = 'active',
    value = true,
) {
    compare = compare || 'uri';
    prop = prop || 'active';
    value = value || true;
    if ( items instanceof Array ) {
        for ( let i = 0; i < items.length; i++ ) {
            if ( items[ i ][ compare ] === doc[ compare ] ) {
                items[ i ][ prop ] = value;
            }
        }
    } else if ( parent[ compare ] === doc[ compare ] ) {
        parent[ prop ] = value;
    }
};
