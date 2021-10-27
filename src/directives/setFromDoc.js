/**
 * Get property value from document
 * @param {string} ref - Page reference
 * @param {string} type - Any document property
 * @param {TwigHouse} twigH - TwigHouse instance
 * @return {null|string} - Document property value
 */
function getFromReference( ref, type, twigH ) {
    const doc = twigH.getDoc( ref );
    if ( doc ) {
        return doc[ type ] || null;
    } else {
        throw Error( 'Could not fetch ' + type + ' from reference: ' + ref );
    }
}

/**
 * Directive: set route
 * @param {string|Array} items - Item value
 * @param {string} key - Item key
 * @param {Object} parent - Item parent
 * @param {TwigHouseDocument} doc - Document object
 * @param {TwigHouse} twigH - TwigHouse instance
 * @param {string} get - Property name to use as reference
 * @param {string} set - Property name to set url
 * @param {string} type - Type to set, uri or url
 * @return {void}
 */
module.exports = function setFromDoc(
    items,
    key,
    parent,
    doc,
    twigH,
    get = 'uri',
    set = null,
    type = null
) {
    get = get || 'uri';
    set = set || get;
    type = type || set || get;
    if ( items instanceof Array ) {
        for ( let i = 0; i < items.length; i++ ) {
            items[ i ][ set ] = getFromReference( items[ i ][ get ], type, twigH );
        }
    } else {
        parent[ set ] = getFromReference( items, type, twigH );
    }
};
