# @squirrel-forge/twighouse

A simple, but extendable, json+twig render tool for node.

## Installation

```
npm i @squirrel-forge/twighouse -g
```

### Quickstart

To see a working example run following commands inside an empty directory.
The example uses directives and the showdown module to render this README.md to html.
For the example you must install showdown yourself, it is neither needed nor required for twighouse itself.
```
npm i showdown@1.9.1
```
Then run the commands to deploy the example and render it. 
```
twighouse example -x
twighouse example dist
```
You will find the compiled files inside the dist directory and the example source data inside the example directory.

## cli usage

```
twighouse target --boolean --path=../dir --str=about --str=index,about
twighouse source target --boolean --path=../dir --str=about --str=index,about
```

### Arguments

#### Using only one argument

the source argument is omitted and assumed to be the current working directory
1. target - Path to write compiled html pages

#### Using two arguments

1. source - Path from where to read *data/* and *templates/*
2. target - Path to write compiled html pages

### Options

 Short | Long          | Type      | Description
------ | ------------- | --------- | ---
  -v   | --version     | bool      | Show the application version
  -d   | --data        | path      | Overrides the data folder
  -f   | --fragments   | path      | Overrides the fragments folder
  -t   | --templates   | path      | Overrides the templates folder
  -p   | --plugins     | path      | Overrides the plugins folder
  -c   | --data-source | str, ...  | Defines a list of data sources to load
  -l   | --limit       | str, ...  | Limit which page or pages should be compiled
  -m   | --minify      | bool      | Minifies the html output
  -o   | --output-json | bool/save | Show/save compiled pages json only
  -i   | --verbose     | bool      | Show additional info
  -s   | --strict      | bool      | Run in strict mode
  -x   | --example     | bool      | Deploy example data and templates, accepts only one, the target, argument

## JSON input

The individual pages json is loaded from the *{source}/data/* directory, this directory is read recursivly by default.
The [fragments](#fragments) are loaded at runtime by reference in your json files and any js files in the [plugins](#plugins) directory are executed right before the page sources are loaded.

Assume following data structure from the example build:
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
 |    | 
 |    |-- footer.json
 |    |-- header.json
 |    |-- meta.json
 |    `-- styles.json
 |
 +-- [plugin_methods]
 |    |
 |    `-- exampleLoader.js
 |
 +-- [plugins]
      |
      `-- example.js

```

### Special properties

In general you will define what you need, there are only a few special properties that can be used.
All of these can be set via the *.twighouse* config file options.

### Page template

 - The *__template* property is described [here](#loading-templates) and must be on the root object.
```
{
  "__template": "{.../}template"
}
```
 - The *document* property gets defined before json processing and is set afterwards and may be modified via the [modify_data](#modify-data) plugin method. Note that the document data object is supplied to any [directives](#directives) running during processing.
```
{
  path: {string} The page reference, includes a full relativ path and the page slug
  dir: {string} The relative path of this page
  slug: {string} The page slug
  uri: {string} The generated page uri
}
```

### Fragments

Fragments work similar to fragements in graphql, though here we require valid json syntax, to include a fragment supply the relative path *string* to the object as property *__fragment* that should receive the fragments properties. Any properties already set will *not be overridden* by the fragment, consider the fragment to be the default data, there can be only one fragment defined per object, but a fragment itself may have a fragment defined in its root which will be processed recursivly.

```{"__fragment": "{.../}fragment", ...overrides}```

For explicit examples check the example source.

### Directives

Directives can modify properties and objects in the defined context of your pages json data, directives can be defined by [adding directives](#adding-directives) via a [plugin](#plugins) or the [api](#api-usage) and can be used as following:

```
{
  "__directives": ["directive_method_name:property_to_use", ...],
  "property_to_use": "*",
  ...
}
```
Directives are always executed in the defined order, which lets you chain them to modify in steps.

## Templates

The templates structure is all yours, following the default loading pattern, which can be modified via the [modify_template](#modify-template) method with a [plugin](#plugins) to load whatever you like.

Following the example structure:
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
      |    |-- raw.twig
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

 Name               | Type   | Default        | Description
--------------------|--------|----------------|---
 verbose            | bool   | false          | Run in verbose mode
 strict             | bool   | false          | Run in strict mode
 root               | str    | ''             | Source directory, empty is the current working directory
 data               | str    | 'data'         | Data directory, if not absolute it will be attached to the root option
 fragments          | str    | 'fragments'    | Fragments directory,
 plugins            | str    | 'plugins'      | Plugins directory,
 templates          | str    | 'templates'    | Templates directory,
 target             | str    | 'dist'         | Target directory, *note that when using the cli tool target default is:* **''**
 resolveFragments   | bool   | true           | Resolve fragments
 fragmentProperty   | str    | '__fragment'   | Fragment property name to load from
 processDirectives  | bool   | true           | Process directives while parsing json 
 ignoreDirectives   | bool   | true           | Ignore directives that are not defined
 directivesProperty | str    | '__directives' | Directives property name to execute from
 directivePrefix    | str    | 'directive_'   | Directive method prefix
 defaultTemplate    | str    | '__page'       | Default template
 templateExt        | str    | '.twig'        | Template file extension
 templateProperty   | str    | '__template'   | Template property to use on page data
 usePlugins         | Array  | []             | Plugin module names or paths to load
 pluginExt          | str    | 'js'           | Plugin file extension
 minify             | bool   | false          | Minify document output
 minifyProperty     | str    | '__minify'     | Minify options property to use on page data
 minifyOptions      | Object | { removeComments : true, collapseWhitespace : true, minifyJS : true, minifyCSS : true } | Minify plugin options

## Plugins

...

### Methods

...

#### Plugin twig
#### Plugin doc
#### Plugin data
#### Plugin template
#### Plugin html
#### Plugin loader

### Plugin directives

...

## Api usage

You can require the TwigHouse class in your node script and run it, change internal options and extend it easily.

```
const TwigHouse = require('@squirrel-forge/twighouse');
const twigH = new TwigHouse( console );
await twigH.init();
await twigH.load();
await twigH.render();
await twigH.write();
```

If you have reached here, explore the code comments. if that does not help, please open an issue if you can't find an answer to your question, I'll be glad to help.
