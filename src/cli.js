/* global require, module, process */
'use strict';

/**
 * Requires
 */
const TwigHouse = require( './TwigHouse' );

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
    const twigH = new TwigHouse( dir );

    // Run application
    const exit_code = await twigH.run();
    process.exit( exit_code );
}
