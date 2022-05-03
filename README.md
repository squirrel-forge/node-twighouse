# @squirrel-forge/twighouse
A simple, but extendable, json+twig render tool for node.

Let's start off with a fitting quote to keep in mind when writing code:

```
"You can't suddenly know something,
 just by assembling a committee of words."
```
*Hubert J. Farnsworth*

If you wish to know more about why I am making this tool, read my [personal note](#personal-note), if you have questions talk to me on twitter [@dasiux](https://twitter.com/dasiux).

## Installation
```
npm i @squirrel-forge/twighouse -g
```

### Quickstart
To see a working example run following commands inside an empty directory.
The example uses directives and the showdown module, included as a dev dependency, to render this README.md to html.
To use the example you must install the dev dependencies or manually install showdown, it is neither needed nor required for twighouse.
```
npm i showdown@1.9.1
```

Then run the commands to deploy the example and render it. 
```
twighouse example -x
twighouse example dist
```
You will find the compiled files inside the dist directory and the example source data inside the example directory.
The example is a lot more complex than what you might need, it tries to illustrate possibilities, but does not include every feature. If you feel there is something important missing please submit a feature request and I will look into it.

## cli usage
```
twighouse target --boolean --path=../dir --str=about --str=index,about
twighouse source target --boolean --path=../dir --str=about --str=index,about
```

For local installations use *npx* to run the twighouse executable.
```
npx twighouse ...
```

### Arguments

#### Using only one argument

the source argument is omitted and assumed to be the current working directory
1. target - Path to write compiled html pages

#### Using two arguments

1. source - Path from where to read *data/* and *templates/*
2. target - Path to write compiled html pages

### Options
A long option always override the value of a short option if both are used.

| Short | Long          | Type      | Description                                                               |
|-------|---------------|-----------|---------------------------------------------------------------------------|
| -a    | --interactive | bool      | Run interactive mode                                                      |
| -h    | --help        | bool      | Show help                                                                 |
| -o    | --output-json | bool/save | Show/save compiled pages json only                                        |
| -m    | --minify      | bool      | Minifies the html output                                                  |
| -l    | --limit       | str, ...  | Limit which page or pages should be compiled                              |
| -d    | --data        | path      | Overrides the data folder                                                 |
| -f    | --fragments   | path      | Overrides the fragments folder                                            |
| -t    | --templates   | path      | Overrides the templates folder                                            |
| -p    | --plugins     | path      | Overrides the plugins folder                                              |
| -c    | --data-source | str, ...  | Defines a list of data sources to load                                    |
| -i    | --verbose     | bool      | Show additional info                                                      |
| -u    | --loose       | bool      | Run in loose mode, disables the strict option                             |
| -q    | --silent      | bool      | Run in silent mode, will throw errors, but show no other output           |
| -v    | --version     | bool      | Show the application version                                              |
| -y    | --show-config | bool      | Show loaded config                                                        |
| -x    | --example     | bool      | Deploy example data and templates, accepts only one, the target, argument |

#### Using url data
You can use urls in certain parts of the application, this example will render using local templates, but loads its data and fragments from urls. Check the [planned features](#planned-features-bugs-and-fixes) for updates.
You must install node-fetch to use the remote support, check the node-util module for details.
```
twighouse example dist -c=https://raw.githubusercontent.com/squirrel-forge/node-twighouse/main/example/data/index.json -d=https://raw.githubusercontent.com/squirrel-forge/node-twighouse/main/example/data -f=https://raw.githubusercontent.com/squirrel-forge/node-twighouse/main/example/fragments -m -u
```

If you wish to use the source argument as an url base you must set the target argument, the template and the plugins option with an absolute path, the *.twighouse* config will be loaded from the current working directory.
```
twighouse https://raw.githubusercontent.com/squirrel-forge/node-twighouse/main/example /{...}/dist -p=/{...}/example/plugins -t=/{...}/example/templates -c=data/index.json -m -u
```

## JSON input
The individual pages json is loaded from the *{source}/data/* directory, this directory is read recursivly by default.
The loaded json is not just json, it does some things if certain [special properties](#special-properties) are present, for example [fragments](#fragments) are loaded at runtime by reference in your json files and can extend your json with shared data but also allow you to override values from that shared json object. You may also place [directives](#directives) inside your json to process specific property values and rewrite them given the value and an optional set of arguments. A [plugin](#plugins) can register a few methods to implement your own needs, for example to modify the resolved json object.

*Assume following data structure from the example build:*
```
[example]
 |
 +-- [data]
 |    |
 |    |-- changelog.json
 |    |-- docs.json
 |    `-- index.json
 |
 +-- [fragments]
      |
      |-- footer.json
      |-- header.json
      |-- meta.json
      |-- styles.json
      `-- table-of-contents.json
```

### Special properties
In general, you will define what you need, there are only a few special properties that can be used.
All of these can be customized via the *.twighouse* [config file options](#configuration-options).

### Page template
The *__template* property is described [here](#loading-templates) and must be on the root object.
```
{
  "__template": "{.../}template"
}
```

### Minify options
Every page can have custom minify options, only used when minify is enabled. The options replace the defaults options, they do not extend. You can find an options reference at the [html-minifier](https://www.npmjs.com/package/html-minifier#options-quick-reference) npm page.
```
{
   "minify": {...}
}
```

### Fragments
Fragments work similar to fragements in graphql, though here we require valid json syntax, to include a fragment supply the relative path *string* to the object as property *__fragment* that should receive the fragments properties. Any properties already set will *not be overridden* by the fragment, consider the fragment to be the default data, there can be only one fragment defined per object, but a fragment itself may have a fragment defined in its root which will be processed recursivly, there is currently no check in place to prevent circular references.
```
{
   "__fragment": "{.../}fragment",
   ...overrides
}
```
For explicit examples check the example source, they may look dangerous, but they are actually very simple to use.

### Document object
The *document* property gets defined before json processing and is set afterwards and may be modified via the [plugin data](#plugin-data) method, but this might cause errors in structure, do not remove or replace the object. Note that *the document object* is supplied to any [directives](#directives) running during processing.

The TwigHouseDocument object has the following properties, they should be treated as read only, but can be modified with possibly unexpected results via a [plugins document method](#plugin-doc).
```
{
   document: TwigHouseDocument: {
     source : 'root/path/file',
     root : 'root/path',
     slug : 'document-slug',
     dir : 'relative/to/root',
     ref : 'dir/slug',
     uri : 'generated.uri',
     url : 'generated.url',
   }
}
```
The document object is added to every page data object and should not be used in the json source since it will get replaced once the load is completed.

### Directives
Directives can modify properties and objects in the defined context of your pages json data, directives can be defined via [plugin directives](#plugin-directives) method inside a [plugin](#plugins). Directive name and argument are separated by colons, the first argument is always the target property. Any further arguments depend on the directive, see the list of [builtin directives](#builtin-directives).
They can be used as following:
```
{
  "__directives": ["directive_method_name:property_to_use:additional_arguments", ...directives],
  "property_to_use": "*",
  ...
}
```
Directives are always executed in the defined order, which lets you chain them to modify values in steps, as can be seen in the demo, first loading the *.md* file from a path and then converting the files content to html with a second directive.

#### Builtin directives
A list of builtin directives an how they can be used.

#### Directive isDocValue
Compares a property to the [document object](#document-object) and sets a property to *true* if the values are equal, used to set nav items active state for example.

*Directive arguments:*

| Name    | Description                                 |
|---------|---------------------------------------------|
| compare | Property to compare, default: 'uri'         |
| write   | Property to set if equal, default: 'active' |
| value   | Value to set, default: true                 |

*Single object:*
```
// Input
{
   "__directives": ["isDocValue:uri"],
   "uri": "/"
}

// Result, assuming the current document is: index
{
   "uri": "/",
   "active": true
}
```

*Array of objects:*
```
// Input
{
   "__directives": ["isDocValue:items"],
   "items": [
      {"uri": "/docs.html"},
      {"uri": "/changelog.html"}
   ]
}

// Result, assuming the current document is: docs
{
   "items": [
      {"uri": "/docs.html", "active": true},
      {"uri": "/changelog.html"}
   ]
}
```

#### Directive setFromDoc
Reads a property with a document reference and sets a property with a specified name, used to set uri/url properties for document references inside the source tree.

*Directive arguments:*

| Name  | Description                                                     |
|-------|-----------------------------------------------------------------|
| read  | Property to read document reference from, default: {read/'uri'} |
| write | Property to set value on, default: {read/'uri'}                 |
| type  | Document object property value to set, default: {write}         |

*Single object:*
```
// Input
{
   "__directives": ["setFromDoc:uri"],
   "uri": "index"
}

// Result
{
   "uri": "/"
}
```

*Array of objects:*
```
// Input
{
   "__directives": ["setFromDoc:items"],
   "items": [
      {"uri": "docs"},
      {"uri": "changelog"}
   ]
}

// Result
{
   "items": [
      {"uri": "/docs.html"},
      {"uri": "/changelog.html"}
   ]
}
```

#### Directive imageData
Reads a property with a image path and sets a property with a specified name with extended image data such as sizes and uri/url.
This directive requires and optional dependency of [image-size](https://www.npmjs.com/package/image-size)

Directive arguments:

| Name  | Description                                               |
|-------|-----------------------------------------------------------|
| read  | Property to read image path from, default: {read/'image'} |
| write | Property to write data to, default: {read/'image'}        |
| root  | Optional image relative root, default: ''                 |

*Single object:*
```
// Input
{
   "__directives": ["imageData:image"],
   "image": "img/foo.jpg"
}

// Result
{
   "image": {
      "height": 1080,
      "width": 640,
      "type": "jpg",
      "src": "img/foo.jpg",
      "uri": "/img/foo.jpg",
      "url": "http://.../img/foo.jpg"
   }
}
```

*Array of objects:*
```
// Input
{
   "__directives": ["imageData:items"],
   "items": [
      {"image": "img/foo.jpg"},
      {"image": "img/picture.jpg"}
   ]
}

// Result
{
   "items": [
      {"image": {...}},
      {"image": {...}}
   ]
}
```

#### Directive sort
Sorts a property with an array value, supports regular sort and by item.property.

*Directive arguments:*

| Name      | Description                                                                      |
|-----------|----------------------------------------------------------------------------------|
| prop      | Object property to sort by, can be set as direction if not needed, default: null |
| direction | Set to 'desc' for reverse order, default: 'asc'                                  |                                  
| compare   | Compare function name                                                            |

Custom compare functions can be registered in a [plugin twig](#plugin-twig) method via the twigH.registerCompare( name: string, fn: Function ) method.

*Single object:*
```
// Input
{
   "__directives": ["sort:things", "sort:numbers:value"],
   "things": {
      "b": 2,
      "a": 5,
      "f": 9,
      "z": 1,
      "c": 4
   },
   "numbers": {
      "b": 2,
      "a": 5,
      "f": 9,
      "z": 1,
      "c": 4
   }
}

// Result
{
   "things": {
      "a": 5,
      "b": 2,
      "c": 4
      "f": 9,
      "z": 1,
   },
   "numbers": {
      "z": 1,
      "b": 2,
      "c": 4
      "a": 5,
      "f": 9,
   }
}
```

*Array of primitives:*
```
// Input
{
   "__directives": ["sort:things"],
   "things": [2,9,7,5,4]
}

// Result
{
   "things": [2,4,5,7,9]
}
```

*Array of objects:*
```
// Input
{
   "__directives": ["imageData:items"],
   "items": [
      {"image": "img/foo.jpg"},
      {"image": "img/picture.jpg"}
   ]
}

// Result
{
   "items": [
      {"image": {...}},
      {"image": {...}}
   ]
}
```

#### Directive tagAttributes
Creates a HTMLAttributes object for improved attribute handling in twig templates.

*Directive arguments:*

| Name  | Description                                                         |
|-------|---------------------------------------------------------------------|
| read  | Property to read attributes data from, default: {read/'attributes'} |
| write | Property to set value on, default: {read/'attribute'}               |

*Single object:*
```
// Input
{
   "__directives": ["tagAttributes:attributes"],
   "attributes": {
      "id": "element-id",
      "class": ["class-a", "class-b"],
   }
}

// Result
{
   "attributes": HTMLAttributes{}
}
```

*Array of objects:*
```
// Input
{
   "__directives": ["tagAttributes:items"],
   "items": [
      {"attributes":{"class": "class-a"}},
      {"attributes":{"id": "some-element-id"}}
   ]
}

// Result
{
   "items": [
      {"attributes": HTMLAttributes{}},
      {"attributes": HTMLAttributes{}}
   ]
}
```

*Object methods available inside twig:*
```
attributes : {
   set( name, value ) : attributes
   has( name ) : boolean
   addClass( classname ) : attributes
   addClasses( classnames ) : attributes
   toString() : string
}
```

## Templates
The templates structure is all yours, following the default [loading pattern](#loading-templates), which can be modified via the [plugin template](#plugin-template) method with a [plugin](#plugins) to load whatever you like.

*Following the example structure:*
```
[example]
 |
 +-- [templates]
      |
      +-- [abstract]
      |    |
      |    |-- component.twig
      |    |-- content.twig
      |    `-- layout.twig
      |
      +-- [components]
      |    |
      |    |-- nav.twig
      |    `-- section.twig
      |
      +-- [partials]
      |    |
      |    |-- footer.twig
      |    |-- header.twig
      |    |-- meta.twig
      |    `-- styles.twig
      |
      `-- __page.twig
```

### Loading templates
Each page can have a *__template* property defined on the root, this should, but does not have to be a *relative path* from the source template directory, excluding the *.twig* extension, which can be changed via the [api](#api-usage)

Possible page templates when using defaults, for page reference *{.../}index* with slug *index*:
 - The **custom template** defined on the page data root.
   ```{source}/templates/{data.__template}.twig```
 - The **individual template** by reference
   ```{source}/templates/{.../}index.twig```
 - The **global template** fallback, when none of the above can be resolved
   ```{source}/templates/__page.twig```

## Project config
A project directory can make use of a *.twighouse* json config file to reduce the need to set options when compiling and also set options that cannot be set via the cli application arguments, options and flags.

### Configuration options
These can be set via the *.twighouse* json config or with the api from a plugin or your own application.

| Name               | Type     | Default        | Description                                                                                                                      |
|--------------------|----------|----------------|----------------------------------------------------------------------------------------------------------------------------------|
| verbose            | bool     | false          | Run in verbose mode (cannot be set via config file)                                                                              |
| strict             | bool     | false          | Run in strict mode                                                                                                               |
| silent             | bool     | false          | Silent mode will prevent any output and should be used with strict = true (cannot be set via config file)                        |
| root               | str      | ''             | Source directory, empty is the current working directory                                                                         |
| data               | str      | 'data'         | Data directory, if not absolute it will be attached to the root option                                                           |
| fragments          | str      | 'fragments'    | Fragments directory,                                                                                                             |
| plugins            | str      | 'plugins'      | Plugins directory,                                                                                                               |
| templates          | str      | 'templates'    | Templates directory,                                                                                                             |
| target             | str      | 'dist'         | Target directory, *note that when using the cli tool target default is:* **''**                                                  |
| resolveFragments   | bool     | true           | Resolve fragments                                                                                                                |
| fragmentProperty   | str      | '__fragment'   | Fragment property name to load from                                                                                              |
| useDirectives      | Array    | []             | Builtin directives to use, can be set to 'all':string to use all builtins                                                        |
| processDirectives  | bool     | true           | Process directives while parsing json                                                                                            |
| ignoreDirectives   | bool     | true           | Ignore directives that are not defined                                                                                           |
| directivesProperty | str      | '__directives' | Directives property name to execute from                                                                                         |
| directivePrefix    | str      | 'directive_'   | Directive method prefix                                                                                                          |
| defaultTemplate    | str      | '__page'       | Default template                                                                                                                 |
| templateExt        | str      | '.twig'        | Template file extension                                                                                                          |
| templateProperty   | str      | '__template'   | Template property to use on page data                                                                                            |
| usePlugins         | Array    | []             | Plugin module names or paths to load                                                                                             |
| pluginExt          | str      | 'js'           | Plugin file extension, currently no options implemented                                                                          |
| jsonHideTypes      | Array    | null           | Hide type and functional data on write                                                                                           |
| jsonDiscardProps   | Array    | ['internals']  | Hide specific prop names on write                                                                                                |
| jsonReplacer       | Function | null           | JSON replacer function (can only be set via the api)                                                                             |
| minify             | bool     | false          | Minify document output                                                                                                           |
| minifyProperty     | str      | '__minify'     | Minify options property to use on page data                                                                                      |
| minifyOptions      | Object   | *defaults      | Minify plugin default options, defaults: { removeComments : true, collapseWhitespace : true, minifyJS : true, minifyCSS : true } |

## Plugins
Plugins can be loaded from local files in the plugins directory or be node modules, plugins cannot be loaded by remote for security reasons. Custom plugins can be placed in the plugins directory where they will be autoloaded or any other directory accessible in your filesystem using a relative path with the usePlugins configuration option in your project config.
You may also set node module names in the usePlugins configuration option to load a plugin from an installable node module.

*Assume following data structure from the example build:*
```
[example]
 |
 +-- [plugin_methods]
 |    |
 |    |-- exampleData.js
 |    |-- exampleDirectiveAsync.js
 |    |-- exampleDirectiveSync.js
 |    |-- exampleDoc.js
 |    |-- exampleHTML.js
 |    |-- exampleLoader.js
 |    |-- exampleTemplate.js
 |    `-- exampleTwig.js
 |
 +-- [plugins]
      |
      `-- example.js
```

### Plugin types
Plugins can be supplied in three ways, class constructors, class instance or plain object.

#### Plugin type: Plain object
The plain object plugin is the simplest form, a basic structure, for details please refer to the example plugin.
```
/**
 * Plain object plugin
 * @type {TwigHousePluginObject}
 */
module.exports = {

    /**
     * Plugin name for reference and error tracking
     * @public
     * @property
     * @type {string}
     */
    __name : 'example',

    /**
     * Define which plugin handlers to use
     * @public
     * @property
     * @type {Array<string>}
     */
    __methods : [ 'twig', 'doc', 'data', 'template', 'html' ],

    /**
     * Register callback to add methods, directive and loaders
     * @public
     * @param {TwigHouse} twigH - TwigHouse instance
     * @return {void}
     */
    __register : ( twigH ) => {}

    // Define our plugin methods
    twig     : () => {},
    doc      : () => {},
    data     : () => {},
    template : () => {},
    html     : () => {},
};
```

#### Plugin type: Class constructor
The class plugin will use the constructors name as reference, all method, directives, loaders, etc. need to be set in the constructor method via the TwigHouse instance.
```
/**
 * Class plugin
 * @class
 * @type {TwigHousePluginClass}
 */
module.exports = class Example {

    /**
     * Constructor
     * @constructor
     * @param {TwigHouse} twigH - TwigHouse instance
     */
    constructor( twigH ) {

        // Use any api methods
    }
};
```

#### Plugin type: Class instance
The class instance plugin will have the gains of using a class combined with the features of a plain object plugin with automatic assignment.
```
/**
 * Class plugin
 * @class
 * @type {TwigHousePluginClass}
 */
class Example {

    /**
     * Constructor
     * @constructor
     */
    constructor() {}

    // The name is derrived from the class constructor and we have to use it,
    // but here we can now use the __methods property and __register method just as with the plain object
}
module.exports = new Example();
```

### Methods
Plugin methods can be defined as described in the previous section, following all available method names that can be set. Please check the TwigHouse source comments and the example plugin for implementation details.

#### Plugin twig
```
/**
 * Extend TwigHouse or the twig template engine
 * Run directly after loading the json tree and plugins, but before reading or processing the data
 * @param {Twig} Twig - Twig template engine
 * @param {TwigHouse} twigH - TwigHouse instande
 * @return {void}
 */
function twig( Twig, twigH ) {

    // Use this to set TwigHouse options and or extend twig with filters etc
}
```

#### Plugin doc
```
/**
 * Modify document data
 * @param {string} ref - Page reference
 * @param {TwigHouseDocument} doc - Document object
 * @param {TwigHouse} twigH - TwigHouse instance
 * @return {void}
 */
function doc( ref, doc, twigH ) {
    
    // Use this to modify the document object for a given page reference
}
```

#### Plugin data
```
/**
 * Modify page data
 * @param {string} ref - Page reference
 * @param {Object} data - Page data
 * @param {TwigHouse} twigH - TwigHouse instance
 * @return {void}
 */
function data( ref, data, twigH ) {

    // Use this to modify the page data object after it has been resolved
}
```

#### Plugin template
```
/**
 * Modify template paths array for page template loading
 * @param {Array<string>} paths - Template paths
 * @param {string} templates - Template root
 * @param {string} ref - Template reference
 * @param {Object} data - Page data
 * @param {TwigHouse} twigH - TwigHouse instance
 * @return {void}
 */
function template( paths, templates, ref, data, twigH ) {

    // Use this to modify template paths/references that will be checked for availability
}
```

#### Plugin html
```
/**
 * Modify the rendered html
 * @param {string} ref - Page reference
 * @param {string} rendered - Rendered html
 * @param {TwigHouse} twigH - TwigHouse instance
 * @return {void}
 */
module.exports = function exampleHTML( ref, rendered, twigH ) {

    // Use this to modify the rendered html string
}
```

#### Plugin loader
```
/**
 * Example data loader
 * @param {string} url - Page data url
 * @param {Array<string>} limit - Limit the collection by reference
 * @param {[string,Object]} data - Page data reference
 * @param {TwigHouse} twigH - TwigHouse instance
 * @return {void}
 */
function loader( url, limit, data, twigH ) {
    // Use this to implement your own reference loading logic
    // Check the example loader for implementation details.
};
```

### Plugin directives
Directives can be registered the following way, see how to define [directives](#directives) in your source json, check the example directives for implementation details.

Activate a builtin directive, see the [builtin directives](#builtin-directives) list for available names.
```
twigH.useDirective( 'isDocValue' );
```

Registering a custom directive, they can be sync or async functions or may return a Promise, but any actual return value is ignored and discarded. Any changes need to be made to Object type values. From the arguments, consider this definition: **parent[ key ] = value** so if value is a string, you need to set *parent[ key ] = 'new value'* to a new value. Any additional params specific to the directive are supplied after the TwigHouse instance to ensure a cleaner argument structure.
```
/**
 * Directive
 * @param {string} value - Property value
 * @param {string} key - Property key
 * @param {Object} parent - Property parent
 * @param {TwigHouseDocument} doc - Document object
 * @param {TwigHouse} twigH - TwigHouse instance
 * @param {...} ... - Any additional arguments
 * @return {void}
 */
function directive( text, key, parent, doc, twigH ) {

    // Do things with the data
}
twigH.registerDirective( 'name', directive );
```

## Api usage
You can require the TwigHouse class in your node script and run it, change internal options and extend it easily, look at the cli implementation and code comments to understand what to run in which order, currently there will be no extended documentation on the js api, since code comments should be sufficient to understand what works in which way.
```
const cfx = require('@squirrel-forge/node-cfx').cfx;
const TwigHouse = require('@squirrel-forge/twighouse');
const twigH = new TwigHouse( cfx );
```
Now that you have reached the end, explore the code comments. if that does not help, please open an issue if you can't find an answer to your question, the squirrel will be glad to help.

## Personal note
I have written a lot of code over the years and one thing that always returned, was the problem to quickly wip up some html, sure you can use all sorts of setups, but they all require some large framework, a complex environment and a lot of work setting everything up. Well I wanted something fast and be able to re-use things without needing to copy-paste and merge updates in loads of files over and over again. I have made a similar a lot simpler tool with php that served me well over the years, but I decided it was time for a fresh approach, hence the switch to node and twig templates. I want to use this tool to build simple sites and make static mockups where the resulting code can be re-used if need be. I enjoy writing useful code and I wanted to share, that somebody else might find it useful also. Feedback, issues and feature requests are welcome, but the latter should focus on the scope of the tool. Although I'd be glad, for now, to help with your own plugin to supply features that do not fit the scope.

*dan aka siux*

## Planned features, bugs and fixes
Whenever there is time and space. Bugs and fixes will always get priority above feature requests, as long as the bug is severe and cannot be solved with a simple workaround. Why is everything open to read and extend? It enables you to do anything you like and yes, break things in the process, but what's the worst that can happen? You understand why, learn something or even help others understand, and hopefully make twighouse better.

**Upcoming features** (in no specific order)
 - Remote template loading? is it possible with twig extends and includes etc?
 - More document properties?
 - More builtin usable directives? ideas?
 - Some useful twig extensions? ideas?

**A note on the side:** TwigHouse will *probably never* implement any sass, javascript or similar compile features, since it is meant for templating and does not want solve problems that belong elsewhere.
