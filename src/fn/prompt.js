/**
 * Start prompting the user
 * @param {boolean} once - Only get input once, default: true
 * @return {Promise<string>} - User input
 */
module.exports = function prompt( once = true ) {
    return new Promise( ( resolve ) => {
        process.stdin[ once ? 'once' : 'on' ]( 'data', resolve );
    } );
};
