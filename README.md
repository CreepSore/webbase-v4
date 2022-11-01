# Webbase v4

## Index
1. Introduction
2. Design Choices
3. Core-Modules
4. Developing Extensions
5. Building and starting the application
6. Logs

## Introduction#
The webbase-v4 is an application-framework targetted to building web-apps using express.js. Despite its name, it's also possible to build normal nodejs-applications with it.

---

## Design Choices
### Main Principle
The main principle of the framework is, that it's built modular. If you don't need certain features (for example [[#Core Db]], you can simply disable the loading of that extension (watch out: you have to disable the loading of Core.Usermgmt too, to mitigate module-resolving-errors).
This makes for an incredibly small filesize, due to the application being built with webpack, configured to not pack any modules you might not need.
Not only the logic that you may implement is built like an extension, but the Core-logic too.
The only few things that you are not able to disable are the absolute core things, like the [ExtensionService](https://github.com/CreepSore/webbase-v4/blob/master/src/service/extensions/ExtensionService.ts) and the [ConfigLoader](https://github.com/CreepSore/webbase-v4/blob/master/src/logic/config/ConfigLoader.ts), since these is the components that handle all extension-loading and configuration. The goal of this project was to develop a neat boilerplate that can handle everything IF needed, and not handle anything at all, when not.

### NPM Dependencies
- express
- express-session
- helmet
- knex
- nodemailer
- sqlite3
- uuid

---

## Core-Modules
- Core-Modules Introduction
- Core
- Core.Web
- Core.Db
- Core.Usermgmt
- Core.Usermgmt.Web
- Core.Mail
- Core.Cache
- Core.Databridge
- Core.Dashboard
- Core.ReactComponents

### Core-Modules Introduction
The core modules provide the most basic functionality for almost everything that you need to develop a web-application. Per default, all core modules are enabled; however they can be disabled (see [[#ExtensionService]])


### Core
The Core module is required by all other Core-Modules. It's currently only used to initialize all defined Loggers.

### Core.Web
The Core.Web module handles the basic setup of the express.js web-server. It exposes functions to easily inject React.js Scripts into an pregenerated HTML Template. It also handles the registry of all client-side JavaScript files, assigning them an UUID on every application start.

### Core.Db
The Core.Db module handles the setup of the Knex-Database-Driver. Per default it's configured to create a local sqlite3 database.

### Core.Usermgmt
The Core.Usermgmt module handles logins using Users and API-Keys and their assigned Permissions. It creates multiple tables using the Core.Db module. It provides functions that handle User-/ and API-Key-Logon and checking their Permissions.

### Core.Usermgmt.Web
To make it possible to not use the Core.Web package, all web-routes that concern the Core.Usermgmt-Modules are defined here. It also provides an express middleware that automatically checks for permissions.

### Core.Mail
The Core.Mail module handles all mail-communication. It provides functions to send mails, and also to send "Alert-Mails", which are mails that are sent to a predefined list of recipients.

### Core.Cache
The Core.Cache module handles data-caching to lessen the load on the webserver and the database. The Core-Modules do NOT utilize this module; it's only there to make life easier to expand the application. Cached-Data is stored by a specified key, and can be invalidated when needed - triggering an update of the data when getting the value the next time.

### Core.Databridge
The Core.Databridge module can handle communication between Frontend-/ and Backend-Scripts, and also is able to communicate with other apps that also utilize this module. The protocol is understandable pretty easily and transferring data to C++ Processes via TCP is possible too.

### Core.Dashboard
The Core.Dashboard module provides an easy-to-use frontend interface for managing Users and Permissions. It exposes functions to register own urls that get shown inside the Navigation-Bar.

### Core.ReactComponents
The Core.ReactComponents module provides universally usable react-components - like Routers. This module does not get loaded by the server ever and is only used while building client-side scripts.

### Custom.Template
The Custom.Template is a copyable module-file with some base-functionality like config-handling. Keep in mind that you have to edit the metadata property.

---

## Developing Extensions
When loading an extension, the [[#ExtensionService]] passes the current Execution-Context to the extension. The context is built as follows:

| Property-Name    | Type             | Description                                   |
| ---------------- | ---------------- | --------------------------------------------- |
| extensionService | ExtensionService | The ExtensionService that loads the extension |
| contextType      | "app"\|"cli"     | Defines the application that is being run     |
| application      | IApplication     | Returns the IApplication that is executed     |

### ExtensionService
The ExtensionService loads all extensions which are not disabled in the `extensions/disabled.json` config (this file is generated at runtime, so you have to either create it by hand or run the app once). It provides functionality to get loaded Modules (dependencies) to execute any exposed functions of them.

### Structure
#### Folder structure
The folder structure is simple. All extensions have a parent folder inside the `extensions/` directory. The entrypoint for an extension is the `index.ts` or `index.js` file residing in that said directory.
Example for Core.Web:
`extensions/Core.Web/index.ts`

To add buildtargets to webpack for the frontend the paths must be defined inside an `${ModuleName}.webpack.json` file.
Example for Core.Dashboard:
`Core.Dashboard.webpack.json`
```json
{
  "entry": {
    "Core.Dashboard.Main.js": "./extensions/Core.Dashboard/web/main.tsx"
  }
}
```

#### Setup
Every Module has to implement the [IExtension](https://github.com/CreepSore/webbase-v4/blob/master/src/service/extensions/IExtension.ts) interface.
Copying the [Custom.Template](https://github.com/CreepSore/webbase-v4/blob/master/extensions/Custom.Template.ts) as your `index.ts` is probably faster than creating your own.
The metadata defines basic information about the module, like name, dependencies and version. The metadata is built as follows:

| Property-Name | Type     | Description                                                                                                  |
| ------------- | -------- | ------------------------------------------------------------------------------------------------------------ |
| name          | string   | The name of the module. It's important to set this, as this is how the ExtensionService registers the module |
| version       | string   | The version of the module. This can be defined however you want.                                             |
| description   | string   | The description of the module. This can be an empty string.                                                  |
| author        | string   | The author of the module. This can be an empty string.                                                       |
| dependencies  | string[] | The dependencies of the module, referenced by their metadata-name.                                           | 

When defining the dependencies, you don't need to specify modules that may be imported by any parent dependency. They'll get loaded automatically doing a binary tree traversal, starting with all modules that do not have any dependency at all (for example, "Core"). 

---

## Building and starting the application
To start the app, you need to run `npm start`. The sources get built before startup (default 
out-directory is `out/`). To only build the app you can run `npm run build`.
To make developing frontend-scripts easier you can use `npm run watchWeb`. This will start webpack as a watch-deamon, which compiles all frontend sources when it detects any changes. Keep in mind that if you add a new webpack config file (like specified in [[#Folder structure]]), you need to restart the command.

---

## Logs
The [LoggerService](https://github.com/CreepSore/webbase-v4/blob/master/src/service/logger/LoggerService.ts) implements a small logging-framework that can be used to log to console, files and internal arrays. The Core Module loads following Loggers per default (doing so by replacing console.log):

| Name          | Description                                               |
| ------------- | --------------------------------------------------------- |
| ConsoleLogger | Logs to the stdout                                        |
| FileLogger    | Logs to `logs/*.txt` files                                |
| CacheLogger   | Logs to an internal array that can be accessed by modules |

The "new" usage of console.log is as follows:
`console.log(LOGLEVEL, ...INFOS, MESSAGE)`
Where LOGLEVEL, INFOS and MESSAGE are all strings.
All "INFOS"-Entries are inserted into square brackets before printing.
Example:
`console.log("INFO", "Core", "Loggers initialized successfully")`
logs
`[2022-10-21T15:05:55.785Z][ INFO][Core] Loggers initialized successfully
using all registered loggers.
