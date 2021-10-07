/* global module */
'use strict';

/**
 * Count object/properties array/length
 *
 * @param {*} obj - An object or array to recusivly count
 *
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
        obj.forEach( val => sum += countRecursive( val ) );

    } else if ( Object.getPrototypeOf( obj ) === Object.prototype ) {

        // Checked that it actually is a plain object, before counting the keys
        const keys = Object.keys( obj );
        sum = keys.length;
        keys.forEach( key => sum += countRecursive( obj[ key ] ) );

    } else {

        // Its an object, but its an instance of something and we wouldn't want to break anything
        // If we do want to count other objects we could add additional code here before returning 0
        return 0;
    }

    // Pass up the count
    return sum;
}

module.exports = {
    __name : 'example',
    directives : {
        navItemActive : ( items, parent, doc, TwigHouse ) => {
            for ( let i = 0; i < items.length; i++ ) {
                if ( items[ i ].uri === doc.uri ) {
                    items[ i ].active = true;
                }
            }
        }
    },
    modify_html : ( ref, rendered, TwigHouse ) => {
        return new Promise( ( resolve, reject ) => {
            console.log( '[html] ' + ref + '::' + rendered[ ref ].length );
            resolve();
        } );
    },
    modify_data : ( ref, data, TwigHouse ) => {
        return new Promise( ( resolve, reject ) => {
            console.log( '[data] ' + ref + '::' + countRecursive( data ) );
            resolve();
        } );
    },
    modify_twig : ( Twig, TwigHouse ) => {
        // Extend twig with filters etc
    },
};
