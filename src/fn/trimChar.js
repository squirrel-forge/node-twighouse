/**
 * Trim custom characters
 *
 * @param {string} str - String to trim
 * @param {string} charsToRemove - Characters to remove
 *
 * @return {string} - Trimmed string
 */
module.exports = function trimChar( str, charsToRemove = ' ' ) {

    // Trim start
    while ( charsToRemove.indexOf( str.charAt( 0 ) ) > -1 ) {
        str = str.substring( 1 );
    }

    // Trim end
    while ( charsToRemove.indexOf( str.charAt( str.length - 1 ) ) > -1 ) {
        str = str.substring( 0, str.length - 1 );
    }
    return str;
};
