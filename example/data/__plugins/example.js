/* global module */
'use strict';

/**
 * Requires
 */
const path = require( 'path' );
const showdown  = require('showdown');

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

/**
 * TwigHousePlugin
 *
 * @type {
 *   {
 *     __name: string,
 *     modify_html: (function(
 *       ref: string,
 *       rendered: Object,
 *       TwigHouse: TwigHouse
 *     ): <void>|Promise<void>),
 *     modify_data: (function(
 *       ref: string,
 *       data: Object,
 *       TwigHouse: TwigHouse
 *     ): <void>|Promise<void>),
 *     modify_twig: (function(
 *       Twig: Twig,
 *       TwigHouse: TwigHouse
 *     ): <void>|Promise<void>),
 *     modify_template: (function(
 *       paths: Array,
 *       templates: string,
 *       ref: string,
 *       data: Object,
 *       TwigHouse: TwigHouse
 *     ): <void>|Promise<void>),
 *     directives: {
 *       any: (function(
 *         items: *,
 *         parent: Object,
 *         doc: Object,
 *         key: string,
 *         TwigHouse: TwigHouse
 *       ): <void>|Promise<void>)
 *     }
 *   }
 * }
 */
module.exports = {

    // Plugin requires a name for error tracking
    __name : 'example',

    // Directives can modify data in your json tree
    directives : {
        navItemActive : ( items, parent, doc, key, TwigHouse ) => {
            if ( items instanceof Array ) {
                for ( let i = 0; i < items.length; i++ ) {
                    if ( items[ i ].uri === doc.uri ) {
                        items[ i ].active = true;
                    }
                }
            } else {
                if ( parent.uri === doc.uri ) {
                    parent.active = true;
                }
            }
        },
        loadFromTwigHouse : async ( target, parent, doc, key, TwigHouse ) => {
            const text_path = path.join( TwigHouse._self, target );
            parent[ key ] = await TwigHouse._resolve_text( text_path );
        },
        showdownConvert : ( target, parent, doc, key, TwigHouse ) => {
            const converter = new showdown.Converter( {
                ghCompatibleHeaderId : true,
                omitExtraWLInCodeBlocks : true,
                tables : true,
            } );
            parent[ key ] = converter.makeHtml( target );
        }
    },

    // Modify the rendered html
    modify_html : ( ref, rendered, TwigHouse ) => {
        return new Promise( ( resolve, reject ) => {
            if ( TwigHouse.verbose ) {
                console.log( '[html] ' + ref + '::' + rendered[ ref ].length + ' characters' );
            }
            resolve();
        } );
    },

    // Modify page data
    modify_data : async ( ref, data, TwigHouse ) => {

        // Added a generic block from the plugin
        if ( data.content instanceof Array ) {
            const pkg = await TwigHouse._resolve_json( path.join( TwigHouse._self, 'package.json' ) );
            data.content.push( {
                "__component": "section",
                "content": `<hr /><p><small>This page was generated using <a href="${pkg.homepage}" target="_blank">${pkg.name}@${pkg.version}</a></small></p>`
            } );
        }

        // Let see how many properties this page has
        if ( TwigHouse.verbose ) {
            console.log( '[data] ' + ref + '::' + countRecursive( data ) + ' entries' );
        }
    },

    // Extend TwigHouse or the twig template engine
    // Run directly after loading the json tree and plugins, but before reading or processing the data
    modify_twig : ( Twig, TwigHouse ) => {
        // Set TwigHouse options etc
        // Extend twig with filters etc
    },

    // Modify template paths array for page template loading
    modify_template : ( paths, templates, ref, data, TwigHouse ) => {

        // Derive a type style global template from the slug only
        // this could be used for index pages if they just display a generic listing
        paths.splice( 1, 0, path.join( templates, '__' + data.document.slug ) + TwigHouse.template_ext );

        // Remove the current global magic template
        // paths.pop();

        // And add a new global template
        // paths.push( path.join( templates, '__global' ) + TwigHouse.template_ext );
    }
};
