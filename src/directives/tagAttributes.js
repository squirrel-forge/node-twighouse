/**
 * Requires
 */
const { isPojo } = require( '@squirrel-forge/node-util' );
const HTMLAttributes = require( '../classes/HTMLAttributes' );

/**
 * Get attributes object
 * @param {string} data - Source data
 * @param {TwigHouseDocument} doc - Document object
 * @param {TwigHouse} twigH - TwigHouse instance
 * @return {null|HTMLAttributes} - HTMLAttributes instance for twig rendering
 */
function getAttributesObject( data, doc, twigH ) {
    let attributes = null;
    try {
        attributes = new HTMLAttributes( data );
    } catch ( e ) {
        twigH.error( new twigH.constructor.TwigHouseDirectiveException( 'Failed to construct attributes', e ) );
    }
    return attributes;
}

/**
 * Directive: set attributes as attribute object
 * @param {string|Array} items - Item value
 * @param {string} key - Item key
 * @param {Object} parent - Item parent
 * @param {TwigHouseDocument} doc - Document object
 * @param {TwigHouse} twigH - TwigHouse instance
 * @param {string} read - Property to read for arrays: 'attributes'
 * @param {string} write - Property to write, default: null|read
 * @return {void}
 */
module.exports = function tagAttributes(
    items,
    key,
    parent,
    doc,
    twigH,
    read = null,
    write = null,
) {
    if ( items instanceof Array ) {
        read = read || 'attributes';
        write = write || read;
        for ( let i = 0; i < items.length; i++ ) {
            const v = items[ i ][ read ];
            if ( v === null || isPojo( v ) || v instanceof Array || [ 'string', 'undefined' ].includes( typeof v ) ) {
                items[ i ][ write ] = getAttributesObject( v, doc, twigH );
            } else if ( !( v instanceof HTMLAttributes ) ) {
                twigH.warn( new twigH.constructor.TwigHouseDirectiveWarning( 'Invalid attributes source type: ' + typeof v ) );
            }
        }
    } else if ( items === null || isPojo( items ) || typeof items === 'string' ) {
        write = write || read || key;
        parent[ write ] = getAttributesObject( items, doc, twigH );
    } else if ( !( items instanceof HTMLAttributes ) ) {
        twigH.warn( new twigH.constructor.TwigHouseDirectiveWarning( 'Invalid attributes source type: ' + typeof items ) );
    }
};
