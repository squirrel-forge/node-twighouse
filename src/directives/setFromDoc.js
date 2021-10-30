/**
 * Requires
 */
const isUrl = require( '../fn/isUrl' );

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
        if ( typeof doc[ type ] !== 'undefined' ) {
            return doc[ type ];
        }
        throw Error( 'Property "' + type + '" does not exist on document: ' + ref );
    } else if ( !isUrl( ref ) && ref[ 0 ] !== '/' ) {
        throw Error( 'Could not fetch "' + type + '" on document not found: ' + ref );
    }
    return null;
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
            const value = getFromReference( items[ i ][ get ], type, twigH );
            if ( value !== null && typeof value !== 'undefined' ) {
                items[ i ][ set ] = value;
            }
        }
    } else {
        const value = getFromReference( items, type, twigH );
        if ( value !== null && typeof value !== 'undefined' ) {
            parent[ set ] = value;
        }
    }
};
