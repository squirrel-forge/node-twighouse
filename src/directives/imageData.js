/**
 * Requires
 */
const path = require( 'path' );
const { FsInterface } = require( '@squirrel-forge/node-util' );

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
let fileType;
try {
    fileType = require( 'file-type' );
} catch ( e ) {
    fileType = null;
}

/**
 * Get image object
 * @param {string} src - Source path
 * @param {string} root - Root path
 * @param {TwigHouseDocument} doc - Document object
 * @param {TwigHouse} twigH - TwigHouse instance
 * @param {string} load - Load as data url, default: false
 * @param {null|string} mime - Set and do not load mimetype, default: null
 * @return {string|{src:string,width:string,height:string}} - Image object
 */
async function getImageObject( src, root, doc, twigH, load = false, mime = null ) {
    let o = {};

    // Set sizeOf type fallback values
    if ( !sizeOf ) {
        twigH.warn( new twigH.constructor.TwigHouseDirectiveWarning( 'Directive imageData uses optional module: image-size@^1.0.0' ) );
        o.type = path.parse( src ).ext;
        if ( o.type[ 0 ] === '.' ) {
            o.type = o.type.substr( 1 );
        }
    } else {

        // Get actual sizeOf values
        o = sizeOf( path.join( twigH.getPath(), src ) );
    }

    // Set src and additional path values
    o.src = src;
    o.uri = doc.constructor.getUriFrom( src, root, twigH );
    o.url = doc.constructor.getUrlFrom( src, root, twigH );

    // Load image source as base64
    if ( load === 'true' ) {

        // Resolve local file path
        const file_path = path.resolve( twigH._config.root, src );
        const file_exists = await FsInterface.exists( file_path );
        if ( !file_exists ) {
            twigH.error( new twigH.constructor.TwigHouseDirectiveException( 'File not found: ' + file_path ) );
        }

        // Note filetype detection
        if ( !fileType ) {
            twigH.warn( new twigH.constructor.TwigHouseDirectiveWarning( 'Directive imageData uses optional module: file-type@^16.5.3' ) );
        }

        // Require mimetype
        if ( !mime && fileType ) {
            const type = await fileType.fromFile( file_path );
            if ( type && type.mime ) {
                mime = type.mime;
            }
        }
        if ( !mime || !mime.length ) {
            twigH.error( new twigH.constructor.TwigHouseDirectiveException(
                ( fileType ? 'Failed to' : 'Could not' ) + ' detect mimetype of: ' + file_path ) );
        }

        // Load file and replace src
        const buf = await FsInterface.read( file_path, 'base64' );
        o.src = `"data:${mime};base64,${buf.toString()}"`;
        o.mime = mime;
    }
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
module.exports = async function imageData(
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
                items[ i ][ write ] = await getImageObject( v, root, doc, twigH );
            }
        }
    } else if ( typeof items === 'string' && items.length ) {
        write = write || read || key;
        parent[ write ] = await getImageObject( items, root, doc, twigH );
    }
};
