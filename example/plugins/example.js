/**
 * Requires
 */
const exampleData = require( '../plugin_methods/exampleData' );
const exampleDirectiveAsync = require( '../plugin_methods/exampleDirectiveAsync' );
const exampleDirectiveSync = require( '../plugin_methods/exampleDirectiveSync' );
const exampleDoc = require( '../plugin_methods/exampleDoc' );
const exampleHTML = require( '../plugin_methods/exampleHTML' );
const exampleLoader = require( '../plugin_methods/exampleLoader' );
const exampleTemplate = require( '../plugin_methods/exampleTemplate' );
const exampleTwig = require( '../plugin_methods/exampleTwig' );

/**
 * Register the example loader
 * @type {boolean}
 */
const ADD_EXAMPLE_LOADER = false;

/**
 * Plugin plain object
 * @type {TwigHousePluginObject}
 */
module.exports = {

    /**
     * Plugin name for reference and error tracking
     * @public
     * @property
     * @type {string}
     */
    __name : 'example',

    /**
     * Define which plugin handlers to use
     * @public
     * @property
     * @type {Array<string>}
     */
    __methods : [ 'twig', 'doc', 'data', 'template', 'html' ],

    // Define our plugin methods
    twig : exampleTwig,
    doc : exampleDoc,
    data : exampleData,
    template : exampleTemplate,
    html : exampleHTML,

    /**
     * Register callback to add methods, directive and loaders
     * @public
     * @param {TwigHouse} twigH - TwigHouse instance
     * @return {void}
     */
    __register : ( twigH ) => {

        // Set loader to use the example loader, this is still experimental and the way loaders work will change
        // Remove the condition to enable the custom loader
        if ( ADD_EXAMPLE_LOADER === true ) {
            twigH.plugins.method( 'loader', exampleLoader );
        }

        // Enable a builtin directive
        // twigH.useDirective( 'navItemActive' );

        // Or use all directives
        twigH.registerBuiltinDirectives( 'all' );

        // Add some custom directives
        twigH.registerDirective( 'loadFromTwigHouse', exampleDirectiveAsync );
        twigH.registerDirective( 'showdownConvert', exampleDirectiveSync );
    }
};
