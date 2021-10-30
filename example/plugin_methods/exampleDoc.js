/**
 * Modify document data
 * @param {string} ref - Page reference
 * @param {TwigHouseDocument} doc - Document object
 * @param {TwigHouse} twigH - TwigHouse instance
 * @return {void}
 */
module.exports = function exampleDoc( ref, doc, twigH ) {
    if ( twigH._config.verbose ) {
        twigH.info( 'ExamplePlugin [doc] >>> ' + ref + '::' + doc.uri );
    }
};
