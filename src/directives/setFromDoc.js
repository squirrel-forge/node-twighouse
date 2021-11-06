/**
 * Requires
 */
const isUrl = require( '../fn/isUrl' );

/**
 * Get property value from document
 * @param {string} ref - Page reference
 * @param {string} type - Any document property
 * @param {TwigHouse} twigH - TwigHouse instance
 * @return {undefined|null|string} - Document property value
 */
function getFromReference( ref, type, twigH ) {
    const doc = twigH.getDoc( ref );
    if ( doc ) {
        if ( typeof doc[ type ] !== 'undefined' ) {
            return doc[ type ];
        }
        twigH.error( new twigH.constructor.TwigHouseException( 'Property "' + type + '" does not exist on document: ' + ref ), true );
    } else if ( !isUrl( ref ) && ref[ 0 ] !== '/' ) {
        twigH.warn( new twigH.constructor.TwigHouseWarning( 'Could not fetch "' + type + '" from document not found: ' + ref ) );
    }
}

/**
 * Directive: set route
 * @param {string|Array} items - Item value
 * @param {string} key - Item key
 * @param {Object} parent - Item parent
 * @param {TwigHouseDocument} doc - Document object
 * @param {TwigHouse} twigH - TwigHouse instance
 * @param {string} read - Property name to use as reference
 * @param {string} write - Property name to set url
 * @param {string} type - Type to set, uri or url
 * @return {void}
 */
module.exports = function setFromDoc(
    items,
    key,
    parent,
    doc,
    twigH,
    read = null,
    write = null,
    type = null
) {
    if ( items instanceof Array ) {

        read = read || 'uri'; // If not specified, use uri
        write = write || read; // If not specified, replace the read value
        type = type || write; // If not specified, use the write value
        for ( let i = 0; i < items.length; i++ ) {
            const value = getFromReference( items[ i ][ read ], type, twigH );
            if ( typeof value !== 'undefined' ) {
                items[ i ][ write ] = value;
            }
        }
    } else {
        write = write || read || key; // If not specified, replace the read value
        type = type || write; // If not specified, use the write value
        const value = getFromReference( items, type, twigH );
        if ( typeof value !== 'undefined' ) {
            parent[ write ] = value;
        }
    }
};
