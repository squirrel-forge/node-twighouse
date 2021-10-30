/**
 * Trim custom characters
 * @param {string} str - String to trim
 * @param {string} charsToRemove - Characters to remove
 * @param {number} limit - Limit the removal count
 * @return {string} - Trimmed string
 */
module.exports = function trimChar( str, charsToRemove = ' ', limit = 0 ) {

    // Trim start
    let start_count = 0;
    while ( charsToRemove.indexOf( str.charAt( 0 ) ) > -1 && ( !limit || limit > start_count ) ) {
        str = str.substring( 1 );
        start_count++;
    }

    // Trim end
    let end_count = 0;
    while ( charsToRemove.indexOf( str.charAt( str.length - 1 ) ) > -1 && ( !limit || limit > end_count ) ) {
        str = str.substring( 0, str.length - 1 );
        end_count++;
    }
    return str;
};
