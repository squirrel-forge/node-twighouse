/* global require, module, process */
'use strict';

/**
 * Requires
 */
const TwigHouse = require( './src/TwigHouse' );

/**
 * Initialize cli
 *
 * @param {string} dir - __dirname of binary
 *
 * @return {Object} - Cli instance
 */
module.exports = async function cli( dir ) {

    /**
     * Initialize application
     */
    const app = new TwigHouse( dir );

    // Run application
    const code = await app.run();
    process.exit( code );
}
