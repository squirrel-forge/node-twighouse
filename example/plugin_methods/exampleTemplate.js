/**
 * Requires
 */
const path = require( 'path' );

/**
 * Modify template paths array for page template loading
 * @param {Array<string>} paths - Template paths
 * @param {string} templates - Template root
 * @param {string} ref - Template reference
 * @param {Object} data - Page data
 * @param {TwigHouse} twigH - TwigHouse instance
 * @return {void}
 */
module.exports = function exampleTemplate( paths, templates, ref, data, twigH ) {

    // Derive a type style global template from the slug only
    // this could be used for index pages if they just display a generic listing
    paths.splice( 1, 0, path.join( templates, '__' + data.document.slug ) );

    // Remove the current global magic template
    // paths.pop();

    // And add a new global template
    // paths.push( path.join( templates, '__global' ) );
    if ( twigH._config.verbose ) {
        twigH.info( 'ExamplePlugin [template] >>> ' + ref + '::' + paths.length + ' paths' );
    }
};
