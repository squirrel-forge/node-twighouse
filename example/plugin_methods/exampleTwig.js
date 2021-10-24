/**
 * Extend TwigHouse or the twig template engine
 * Run directly after loading the json tree and plugins, but before reading or processing the data
 * @param {Twig} Twig - Twig template engine
 * @param {TwigHouse} twigH - TwigHouse instande
 * @return {void}
 */
module.exports = function exampleTwig( Twig, twigH ) {
    if ( twigH._config.verbose ) {
        twigH._info( 'ExamplePlugin [twig] >>> Running @squirrel-forge/twighouse@' + twigH.VERSION + ' with twig@' + Twig.VERSION );
    }

    // Use this method to:
    //  - Set TwigHouse options etc
    //  - Extend twig with filters etc
};
