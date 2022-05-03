/**
 * Requires
 */
const path = require( 'path' );
const { FsInterface } = require( '@squirrel-forge/node-util' );

/**
 * Count object/properties array/length
 * @param {*} obj - An object or array to recursively count
 * @return {number} - Will always return 0 when supplied with a non object
 */
function countRecursive( obj ) {

    // Only allow actual objects
    if ( obj === null || typeof obj !== 'object' ) {
        return 0;
    }

    let sum;
    if ( obj instanceof Array ) {

        // Arrays are simple to count
        sum = obj.length;
        obj.forEach( ( val ) => { return sum += countRecursive( val ); } );

    } else if ( Object.getPrototypeOf( obj ) === Object.prototype ) {

        // Checked that it actually is a plain object, before counting the keys
        const keys = Object.keys( obj );
        sum = keys.length;
        keys.forEach( ( key ) => { return sum += countRecursive( obj[ key ] ); } );

    } else {

        // Its an object, but its an instance of something and we wouldn't want to break anything
        // If we do want to count other objects we could add additional code here before returning 0
        return 0;
    }

    // Pass up the count
    return sum;
}

/**
 * Modify page data
 * @param {string} ref - Page reference
 * @param {Object} data - Page data
 * @param {TwigHouse} twigH - TwigHouse instance
 * @return {Promise<void>} - Possibly throws errors in strict mode
 */
module.exports = async function exampleData( ref, data, twigH ) {

    // Add a generic block from the plugin
    if ( data.content instanceof Array ) {
        const pkg = await FsInterface.readJSON( path.join( twigH.installDirectory, 'package.json' ) );
        data.content.push( {
            '__component' : 'section',
            'content' : `<hr /><p><small>This page was generated using <a href="${pkg.homepage}" target="_blank">${pkg.name}@${pkg.version}</a></small></p>`
        } );
    }

    // Let see how many properties this page has
    if ( twigH._config.verbose ) {
        twigH.info( 'ExamplePlugin [data] >>> ' + ref + '::' + countRecursive( data ) + ' entries' );
    }
};
