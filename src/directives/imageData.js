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
    let o = {};
    if ( !sizeOf ) {
        twigH.warn( new twigH.constructor.TwigHouseDirectiveWarning( 'Directive imageData uses optional module: image-size ^1.0.0' ) );
        o.type = path.parse( src ).ext;
        if ( o.type[ 0 ] === '.' ) {
            o.type = o.type.substr( 1 );
        }
    } else {
        o = sizeOf( path.join( twigH.getPath(), src ) );
    }
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
 * @param {string} read - Property to read for arrays: 'image'
 * @param {string} write - Property to write, default: null
 * @param {string} root - Optional root
 * @return {void}
 */
module.exports = function imageData(
    items,
    key,
    parent,
    doc,
    twigH,
    read = null,
    write = null,
    root = '',
) {
    if ( items instanceof Array ) {
        read = read || 'image';
        write = write || read;
        for ( let i = 0; i < items.length; i++ ) {
            const v = items[ i ][ read ];
            if ( typeof v === 'string' && v.length ) {
                items[ i ][ write ] = getImageObject( v, root, doc, twigH );
            }
        }
    } else if ( typeof items === 'string' && items.length ) {
        write = write || read || key;
        parent[ write ] = getImageObject( items, root, doc, twigH );
    }
};
