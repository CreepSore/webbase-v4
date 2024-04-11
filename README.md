# Webbase v4

## 📑 Index
- [Webbase v4](#webbase-v4)
  - [📑 Index](#-index)
  - [🌐 Introduction](#-introduction)
  - [🎨 Design Choices](#-design-choices)
    - [Main Principle](#main-principle)
    - [🧩 Core-Modules Introduction](#-core-modules-introduction)
  - [🔌 Developing Extensions](#-developing-extensions)
  - [🏗️ Building and starting the Application](#️-building-and-starting-the-application)
    - [Building and starting the Application](#building-and-starting-the-application)
    - [Configuration](#configuration)
  - [📜 Logs](#-logs)
  - [⚙ Environment](#-environment)

## 🌐 Introduction

The webbase-v4 framework is designed for developing web applications using express.js. It's versatile, allowing for the creation of both web apps and standard node.js applications.


---

## 🎨 Design Choices

### Main Principle
- Modular Design: Tailor the framework to your needs. Disable unneeded features for a leaner application.
  - Example: If you don't require [Core_Db](https://github.com/CreepSore/webbase-v4/blob/main/#coredb), disable it to avoid module-resolving-errors. Remember, disabling Core.Db necessitates disabling Core.Usermgmt as well.
- Efficiency: Thanks to webpack configuration, the application minimizes filesize by excluding unnecessary components.


---


### 🧩 Core-Modules Introduction
The core modules form the foundation of the webbase-v4 framework, offering essential functionalities required for web application development. By default, all core modules are activated, providing a comprehensive suite of tools right from the start. These modules can be individually disabled to streamline the application, according to specific needs (for guidance, refer to [ExtensionService](https://github.com/CreepSore/webbase-v4/blob/main/#extensionservice)).

| Module               | Description                                                                                      |
|----------------------|--------------------------------------------------------------------------------------------------|
| Core                 | The primary module, encompassing basic framework utilities and configurations.                   |
| Core.Web             | Facilitates the creation and management of web services, including HTTP server configurations.   |
| Core.Db              | Provides database integration and management functionalities, supporting various DBMS.           |
| Core.Usermgmt        | Manages user accounts, authentication, and authorization processes.                              |
| Core.Usermgmt.Web    | Extends Core.Usermgmt with web interfaces for user management.                                   |
| Core.Mail            | Enables email sending capabilities, supporting template-based email generation.                  |
| Core.Cache           | Implements caching mechanisms to enhance application performance and reduce load times.          |
| Core.Databridge      | Facilitates data exchange between different parts of the application or with external services.  |
| Core.Dashboard       | Offers a dashboard module for monitoring and managing application states.                        |
| Core.ReactComponents | Provides a set of React components for building user interfaces.                                 |


## 🔌 Developing Extensions
Developing extensions allows you to expand the capabilities of the webbase-v4 framework. Extensions can add new features, integrate with external services, or modify existing functionality. The process involves the `ExtensionService`, which manages the loading and execution of extensions.

When you load an extension, the `ExtensionService` dynamically incorporates it into the application by providing an execution context. This context includes essential information and services the extension might need.

To start developing extensions you can use following command:

```bash
# node src/install.js --extinit='[extension name]'
# Example:
node src/install.js --extinit='Core.Db'
```
This will create a new extension from the template extension project.

## 🏗️ Building and starting the Application
To get your application running, there are a few steps you need to follow. This process involves building your application from the source code and then starting it on your server or development environment.

We are using Webpack to build the app sources and esbuild to build the web sources.

Our goal is to eventually build everything using esbuild.

### Building and starting the Application
To build the application, you must

1. Clone the repository
2. Install the dependencies
3. Build the app-/ and the web-sources
4. Execute the build-result

Using the terminal, this would look like this:

```bash
# Cloning the repository
git clone https://github.com/CreepSore/webbase-v4
cd webbase-v4

# Installing the dependencies
npm install

# Building both app and web sources
npm run build
# or
# npm run dbuild
# for a development build

node out/src/app.js
```

For a quicker start you can also use one of these commands:

```bash
# Builds and starts the app in production mode
npm run start

# Builds and starts the app in development mode
npm run dstart
```

To make things easier we also provide a live-reload for all web-sources.  
Watch out: The live-reload is only active when building and running in development mode!

```bash
# This starts the esbuild watcher for web-files
npm run watchWeb
```

### Configuration
After starting the application for the first time the template configuration files will be exported by default to `./cfg/template`.
You can simply copy them into their parent directory and adapt the configuration to your needs.

Normally the Core-Extensions do **NOT** throw an error if no config exists.
This ensures a clean first start.

If you already have config files somewhere on your system, you can use enviroment variables to specify the base path (see [Enviornment Variables](#-environment)).


## 📜 Logs
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

There is also a High-Level Logging API available. Using it looks like this:

```javascript
LogBuilder
    .start()
    .level("INFO")
    .info("Core")
    .line("Loggers initialized successfully")
    .done();
```

## ⚙ Environment
| Name              | Description                                                          | Example              |
| ----------------- | -------------------------------------------------------------------- | -------------------- |
| CFG_PATH          | Absolute path to the config files                                    | /mnt/config          |
| CFG_TEMPLATE_PATH | Absolute path where the template config files should be generated at | /mnt/config/template |
