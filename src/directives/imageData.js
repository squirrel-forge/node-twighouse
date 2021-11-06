/**
 * Requires
 */
const path = require( 'path' );

/**
 * Optional modules
 * Will cause warning only when using the directive
 */
let sizeOf;
try {
    sizeOf = require( 'image-size' );
} catch ( e ) {
    sizeOf = null;
}

/**
 * Get image object
 * @param {string} src - Source path
 * @param {string} root - Root path
 * @param {TwigHouseDocument} doc - Document object
 * @param {TwigHouse} twigH - TwigHouse instance
 * @return {string|{src:string,width:string,height:string}} - Image object
 */
function getImageObject( src, root, doc, twigH ) {
    if ( !sizeOf ) {
        twigH.warn( new twigH.constructor.TwigHouseWarning( 'Directive imageData requires optional module: image-size ^1.0.0' ) );
        return src;
    }
    const o = sizeOf( path.join( twigH.getPath(), src ) );
    o.src = src;
    o.uri = doc.constructor.getUriFrom( src, root, twigH );
    o.url = doc.constructor.getUrlFrom( src, root, twigH );
    return o;
}

/**
 * Directive: set as image data object
 * @param {string|Array} items - Item value
 * @param {string} key - Item key
 * @param {Object} parent - Item parent
 * @param {TwigHouseDocument} doc - Document object
 * @param {TwigHouse} twigH - TwigHouse instance
 * @param {string} prop - Property to read and write, default: 'image'
 * @param {string} root - Optional root
 * @return {void}
 */
module.exports = function imageData(
    items,
    key,
    parent,
    doc,
    twigH,
    prop = 'image',
    root = '',
) {
    if ( items instanceof Array ) {
        for ( let i = 0; i < items.length; i++ ) {
            const v = items[ i ][ prop ];
            if ( typeof v === 'string' && v.length ) {
                items[ i ][ prop ] = getImageObject( v, root, doc, twigH );
            }
        }
    } else if ( typeof items === 'string' && items.length ) {
        parent[ key ] = getImageObject( items, root, doc, twigH );
    }
};
