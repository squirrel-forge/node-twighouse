# @squirrel-forge/twighouse

A simple, but extendable, json+twig render tool for node.

### Installation:
```shell script
npm i @squirrel-forge/twighouse -g
```

## Usage:
```shell script
twighouse source dist --boolean --path=../dir --str=about --str=index,about
```

## Quickstart
To see a working example run the command as following inside an empty directory.
```shell script
twighouse -x
twighouse example dist
```
You will find the compiled files inside the dist directory and the example source data inside the example directory.

### Arguments:

#### Using only one argument
the source argument is omitted and assumed to be the current working directory
1. target - Path to write compiled html pages

#### Using two arguments
1. source - Path from where to read *data/* and *templates/*
2. target - Path to write compiled html pages

### Options:

 Short | Long        | Type  | Description
------ | ----------- | ----- | ---
  -d   | --data      | path    | Overrides the source path argument for the data folder
  -t   | --templates | path    | Overrides the source path argument for the templates folder
  -l   | --limit     | str, .. | Limit which page or pages should be compiled
  -m   | --minify    | bool    | Minifies the html output
  -o   | --only      | bool    | Show compiled pages json only
  -v   | --verbose   | bool    | Show additional info
  -x   | --example   | bool    | Deploy example data and templates
