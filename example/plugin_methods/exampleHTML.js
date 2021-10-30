/**
 * Modify the rendered html
 * @param {string} ref - Page reference
 * @param {string} rendered - Rendered html
 * @param {TwigHouse} twigH - TwigHouse instance
 * @return {Promise<void>} - Does not do anything but count html length
 */
module.exports = function exampleHTML( ref, rendered, twigH ) {
    return new Promise( ( resolve ) => {
        if ( twigH._config.verbose ) {
            twigH.info( 'ExamplePlugin [html] >>> ' + ref + '::' + rendered[ ref ].length + ' characters' );
        }
        resolve();
    } );
};
