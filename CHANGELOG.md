# Changelog

## 0.9.0
 - Updated all dependencies.
 - Fixed missing FsInterface office.
 - Added *tagAttributes* directive as a helper for twig attributes rendering.
 - Improved data loading and directive error origin declaration.

## 0.8.11
 - Removed unused, helper functions and classes in favor of versions from @squirrel-forge/node-util module.
 - Switched to safer instanceof check from *Exception* to *Error*.

## 0.8.10
 - Fixed OutputBuffer name typo.

## 0.8.9
 - Added postinstall that creates an empty *.twighouse* config in your project directory if installed locally.
 - Added application help command, to list arguments and options.
 - Moved showdown back to dev dependencies.
 - Removed application json output circular check, json replacer resolves the issue and deals with document conversion.

## 0.8.7
 - Colored exceptions, enforce path relations, api cache clear, directive imageData and sort, improved directives, json stringify replacer, implemented output buffer for better twig render errors and warnings.

   [github beta release](https://github.com/squirrel-forge/node-twighouse/releases/tag/0.8.7)

## 0.8.4
 - Cleaned up error handling and output, added interactive mode, fixed setFromDoc directive for unknown uri/url, renamed navItemActive to isDocValue and added more docs.

   [github beta release](https://github.com/squirrel-forge/node-twighouse/releases/tag/0.8.4)

## 0.7.8
 - Added document object and setFromDoc directive performed some cleanups.

## 0.7.2
 - Minor features, fixes and documentation update.

## 0.6.0
 - Complete restructure, still missing docs update, most options still work as before.

   [github restructure release](https://github.com/squirrel-forge/node-twighouse/releases/tag/0.6.0)

## 0.3.0
 - Some docs, more example data, templates and plugin details.

   [github alpha release](https://github.com/squirrel-forge/node-twighouse/releases/tag/0.3.0)

   [npm alpha release](https://www.npmjs.com/package/@squirrel-forge/twighouse/v/0.3.0)

## 0.2.0
 - Core features prototype.
