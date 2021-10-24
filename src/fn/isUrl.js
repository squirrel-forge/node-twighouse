/**
 * String is url
 * @param {string} str - Possible url string
 * @return {boolean} - True if valid url
 */
module.exports = function isUrl( str ) {
    let url;
    try {
        url = new URL( str );
    } catch ( e ) {
        return false;
    }
    return url.protocol === 'http:' || url.protocol === 'https:';
};
