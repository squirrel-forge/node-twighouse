/**
 * Optional modules
 * Will cause warning only when using the directive
 */
let showdown;
try {
    showdown = require( 'showdown' );
} catch ( e ) {
    showdown = null;
}

/**
 * Directive: convert markdown text with showdown
 * @param {string} text - Markdown to convert
 * @param {string} key - Item key
 * @param {Object} parent - Item parent
 * @param {TwigHouseDocument} doc - Document object
 * @param {TwigHouse} twigH - TwigHouse instance
 * @return {Promise<void>} - Possibly throws errors in strict mode
 */
module.exports = function exampleDirectiveSync( text, key, parent, doc, twigH ) {
    if ( !showdown ) {
        twigH.warn( new twigH.constructor.TwigHouseWarning( 'Directive showdownConvert requires optional module: showdown ^1.9.1' ) );
        return text;
    }
    const converter = new showdown.Converter( {
        ghCompatibleHeaderId : true,
        omitExtraWLInCodeBlocks : true,
        tables : true,
    } );
    parent[ key ] = converter.makeHtml( text );
    if ( twigH._config.verbose ) {
        const current_count = twigH.directiveStats[ 'showdownConvert' ] || 0;
        twigH.info( 'ExamplePlugin Directive [showdownConvert] >>> Total calls: ' + current_count );
    }
};
