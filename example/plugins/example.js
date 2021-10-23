/**
 * Requires
 */
const path = require( 'path' );
const showdown  = require( 'showdown' );

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
 * Call stats
 * @type {{name:number}}
 */
const callStats = {};

/**
 * Register/increment a name count
 * @param {string} name - Reference
 * @return {number} - Current count
 */
function callCount( name ) {
    if ( !callStats[ name ] ) {
        callStats[ name ] = 0;
    }
    callStats[ name ]++;
    return callStats[ name ];
}

/**
 * TwigHousePlugin
 *
 * @type {
 *   {
 *     __name: string,
 *     __methods: Array<string>,
 *     html: (function(
 *       ref: string,
 *       rendered: Object,
 *       TwigHouse: TwigHouse
 *     ): <void>|Promise<void>),
 *     data: (function(
 *       ref: string,
 *       data: Object,
 *       TwigHouse: TwigHouse
 *     ): <void>|Promise<void>),
 *     twig: (function(
 *       Twig: Twig,
 *       TwigHouse: TwigHouse
 *     ): <void>|Promise<void>),
 *     template: (function(
 *       paths: Array,
 *       templates: string,
 *       ref: string,
 *       data: Object,
 *       TwigHouse: TwigHouse
 *     ): <void>|Promise<void>),
 *     directive_any: (function(
 *       items: *,
 *       parent: Object,
 *       doc: Object,
 *       key: string,
 *       TwigHouse: TwigHouse
 *     ): <void>|Promise<void>)
 *   }
 * }
 */
module.exports = {

    // Plugin requires a name for error tracking
    __name : 'example',

    // We can use the __methods property to define which methods should be used as plugin handlers
    __methods : [
        'twig',
        'doc',
        'data',
        'template',
        'html',
        'directive_navItemActive',
        'directive_loadFromTwigHouse',
        'directive_showdownConvert',
    ],

    /**
     * Directive: nav item active state
     * @param {string|Array} items - Item value
     * @param {string} key - Item key
     * @param {Object} parent - Item parent
     * @param {TwigHouseDocument} doc - Document object
     * @param {TwigHouse} twigH - TwigHouse instance
     * @return {void}
     */
    directive_navItemActive : ( items, key, parent, doc, twigH ) => {
        if ( items instanceof Array ) {
            for ( let i = 0; i < items.length; i++ ) {
                if ( items[ i ].uri === doc.uri ) {
                    items[ i ].active = true;
                }
            }
        } else if ( parent.uri === doc.uri ) {
            parent.active = true;
        }
        const current_count = callCount( 'navItemActive' );
        if ( twigH._config.verbose ) {
            twigH._info( 'Directive [navItemActive] >>> Total calls: ' + current_count );
        }
    },

    /**
     * Directive: load text from TwigHouse install
     * @param {string} target - Target path to load
     * @param {string} key - Item key
     * @param {Object} parent - Item parent
     * @param {TwigHouseDocument} doc - Document object
     * @param {TwigHouse} twigH - TwigHouse instance
     * @return {Promise<void>} - Possibly throws errors in strict mode
     */
    directive_loadFromTwigHouse : async( target, key, parent, doc, twigH ) => {
        const text_path = path.join( twigH.installDirectory, target );
        parent[ key ] = await twigH.fs.readText( text_path );
        const current_count = callCount( 'loadFromTwigHouse' );
        if ( twigH._config.verbose ) {
            twigH._info( 'Directive [loadFromTwigHouse] >>> Total calls: ' + current_count );
        }
    },

    /**
     * Directive: convert markdown text with showdown
     * @param {string} text - Markdown to convert
     * @param {string} key - Item key
     * @param {Object} parent - Item parent
     * @param {TwigHouseDocument} doc - Document object
     * @param {TwigHouse} twigH - TwigHouse instance
     * @return {Promise<void>} - Possibly throws errors in strict mode
     */
    directive_showdownConvert : ( text, key, parent, doc, twigH ) => {
        const converter = new showdown.Converter( {
            ghCompatibleHeaderId : true,
            omitExtraWLInCodeBlocks : true,
            tables : true,
        } );
        parent[ key ] = converter.makeHtml( text );
        const current_count = callCount( 'showdownConvert' );
        if ( twigH._config.verbose ) {
            twigH._info( 'Directive [showdownConvert] >>> Total calls: ' + current_count );
        }
    },

    /**
     * Extend TwigHouse or the twig template engine
     * Run directly after loading the json tree and plugins, but before reading or processing the data
     * @param {Twig} Twig - Twig template engine
     * @param {TwigHouse} twigH - TwigHouse instande
     * @return {void}
     */
    twig : ( Twig, twigH ) => {
        if ( twigH._config.verbose ) {
            twigH._info( 'Plugin [twig] >>> @squirrel-forge/twighouse@' + twigH.VERSION + ' and twig@' + Twig.VERSION );
        }

        // Use this method to:
        //  - Set TwigHouse options etc
        //  - Extend twig with filters etc
    },

    /**
     * Modify page data
     * @param {string} ref - Page reference
     * @param {Object} data - Page data
     * @param {TwigHouse} twigH - TwigHouse instance
     * @return {Promise<void>} - Possibly throws errors in strict mode
     */
    data : async( ref, data, twigH ) => {

        // Add a generic block from the plugin
        if ( data.content instanceof Array ) {
            const pkg = await twigH.fs.readJSON( path.join( twigH.installDirectory, 'package.json' ) );
            data.content.push( {
                '__component' : 'section',
                'content' : `<hr /><p><small>This page was generated using <a href="${pkg.homepage}" target="_blank">${pkg.name}@${pkg.version}</a></small></p>`
            } );
        }

        // Let see how many properties this page has
        if ( twigH._config.verbose ) {
            twigH._info( 'Plugin [data] >>> ' + ref + '::' + countRecursive( data ) + ' entries' );
        }
    },

    /**
     * Modify document data
     * @param {string} ref - Page reference
     * @param {TwigHouseDocument} doc - Document object
     * @param {TwigHouse} twigH - TwigHouse instance
     * @return {void}
     */
    doc : ( ref, doc, twigH ) => {
        if ( twigH._config.verbose ) {
            twigH._info( 'Plugin [doc] >>> ' + ref + '::' + doc.uri );
        }
    },

    /**
     * Modify template paths array for page template loading
     * @param {Array<string>} paths - Template paths
     * @param {string} templates - Template root
     * @param {string} ref - Template reference
     * @param {Object} data - Page data
     * @param {TwigHouse} twigH - TwigHouse instance
     * @return {void}
     */
    template : ( paths, templates, ref, data, twigH ) => {

        // Derive a type style global template from the slug only
        // this could be used for index pages if they just display a generic listing
        paths.splice( 1, 0, path.join( templates, '__' + data.document.slug ) );

        // Remove the current global magic template
        // paths.pop();

        // And add a new global template
        // paths.push( path.join( templates, '__global' ) );
        if ( twigH._config.verbose ) {
            twigH._info( 'Plugin [template] >>> ' + ref + '::' + paths.length + ' paths' );
        }
    },

    /**
     * Modify the rendered html
     * @param {string} ref - Page reference
     * @param {string} rendered - Rendered html
     * @param {TwigHouse} twigH - TwigHouse instance
     * @return {Promise<void>} - Does not do anything but count html length
     */
    html : ( ref, rendered, twigH ) => {
        return new Promise( ( resolve ) => {
            if ( twigH._config.verbose ) {
                twigH._info( 'Plugin [html] >>> ' + ref + '::' + rendered[ ref ].length + ' characters' );
            }
            resolve();
        } );
    },
};
