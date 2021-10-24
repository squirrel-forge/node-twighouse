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
 * TwigHouse Example Plugin Object
 *
 * @type {TwigHousePluginObject}
 */
module.exports = {

    // Plugin requires a name for error tracking
    __name : 'example',

    // We can use the __methods property to define which methods should be used as plugin handlers
    __methods : [ 'twig', 'doc', 'data', 'template', 'html' ],

    // Define our plugin methods
    twig : exampleTwig,
    doc : exampleDoc,
    data : exampleData,
    template : exampleTemplate,
    html : exampleHTML,

    /**
     * Register module
     * @param {TwigHouse} twigH - TwigHouse instance
     * @return {void}
     */
    __register : ( twigH ) => {

        // Set loader to use the example loader, this is still experimental and the way loaders work will change
        // Remove the condition to enable the custom loader
        if ( twigH.__add_example_loader === true ) {
            twigH.plugins.method( 'loader', exampleLoader );
        }

        // Enable a builtin directive
        twigH.useDirective( 'navItemActive' );

        // Add some custom directives
        twigH.registerDirective( 'loadFromTwigHouse', exampleDirectiveAsync );
        twigH.registerDirective( 'showdownConvert', exampleDirectiveSync );
    }
};
