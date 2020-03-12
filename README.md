# GConf

A simple gosu implementation of configuration manager.

## Public Constructors

| Constructors                                                 |
| ------------------------------------------------------------ |
| Configuration()                                              |
| Configuration(prefix : String)                               |
| Configuration(prefix : String, profile : String)             |
| Configuration(confDir : String, prefix : String, profile : String) |

## Public Property

| Property                       | Description                                  |
| ------------------------------ | -------------------------------------------- |
| static DefaultConfDir : String | Returns the default configuration directory. |

## Public Methods

| Methods                                                      |
| ------------------------------------------------------------ |
| static clear(prefix : String)                                |
| static get(confDir : String, prefix : String, profile : String, prop : String) : String |
| static get(prefix : String, profile: String, prop : String) : String |
| static get(prefix : String, prop : String) : String          |
| static get(prop : String)                                    |
| getProp(prop: String) : String                               |
| static getDate(confDir : String, prefix : String, environment : String, prop : String): Date |
| static getDate(prefix : String, profile: String, prop : String) : Date |
| static getDate(prefix : String, prop : String) : Date        |
| static getDate(prop : String) : Date                         |

#### Method Descriptions

| Method  | Description                                                  |
| ------- | ------------------------------------------------------------ |
| clear   | Marks a particular prefix to be dirty to force it to reload without restarting. |
| get     | Returns the value of a particular property as String instance. |
| getDate | Returns the value of a date property *(i.e. having the format YYYY-MM-DD)* as Date instance. |
| getProp | Works like a get method but at instance level.               |

## All Parameters Used

| Parameter | Type   | Default     | Description                                                  |
| --------- | ------ | ----------- | ------------------------------------------------------------ |
| confDir   | String | .\\gconf    | The directory to hold the configuration files. The default can be overridden by defining an environment variable **GCONF_DIR** that points to the new desired location. Another way is to use the **gconf.properties**. The GCONF_DIR always takes the precedence. *The configuration files must have the **conf** extension name (e.g. application.conf).* |
| prefix    | String | application | The actual name of the configuration file. *The extension name of the file must be **conf** (e.g. application.conf).* |
| profile   | String |             | The configuration profile. Normally is becomes the suffix of the  configuration file. |
| prop                 | String       |  |The target property to retrieve the value from.|

## The gconf.properties File

The properties file that can control the behavior of the **Configuration** instance if it is available from the classpath. The format of this file must be like the following:

#### Sample gconf.properties File

```properties
#The default configuration directory to be looked at.
ConfDir=.\\gconf

#The default configuration filename.
DefaultPrefix=

#The default configuration profile.
DefaultProfile=

#--- Related to hot configuration.
#Indicates if the configuration should reload without restart.
Hot=false

#ConfigMonitorDelay is in seconds.
ConfigMonitorDelay=
```

#### Fields in gconf.properties

| Field              | Description                                                  |
| ------------------ | ------------------------------------------------------------ |
| ConfDir            | The default locations of the configuration directory.        |
| DefaultPrefix      | Change the default prefix *(i.e. application)* to the value of this. |
| DefaultProfile     | The default profile to use if necessary. Otherwise, leave this blank. |
| Hot                | This must be set to **true** if you want the change in the configuration file to have an immediate effect without restarting. *Only use this for testing the configuration.* |
| ConfigMonitorDelay | Controls the **interval (i.e. seconds)** to check for the freshness of the configuration files. If not set, the default is 5s interval. *(This is only has effect if the **hot field** is true.)* |

## Configuration File

The configuration file is just a **normal properties file**. The naming convention of the configuration file is as follows:

```
<prefix>-<profile>.conf
```

The configuration files that were created must be inside the **default configuration directory** or to where the **confDir** is pointing to.

## Usage

#### As a Code Dependency to Your Gosu Project

Add the following **maven** dependency to your **gosu** project:

| Property    | Value            |
| ----------- | ---------------- |
| Group ID    | xyz.ronella.gosu |
| Artifact ID | gconf            |
| Version     | 1.0.0            |

> Using gradle, this can be added as a dependency entry like the following:
>
> ```groovy
> compile group: 'xyz.ronella.gosu', name: 'gconf', version: '1.0.0'
> ```

#### Retrieving the Prop1 String Value from Default Configuration File *(i.e. application.conf)*

```gosu
Configuration.get("Prop1")
```

#### Retrieving the Prop1 String Value from Server Configuration File *(i.e. Server.conf)*

```gosu
Configuration.get("Server", "Prop1")
```

#### Retrieving the Prop1 String Value from Server Configuration File  with Test profile *(i.e. Server-Test.conf)*

```gosu
Configuration.get("Server", "Test", Prop1")
```

#### Retrieving the Prop1 String Value from Server Configuration File  with Test profile *(i.e. Server-Test.conf)* in a non default configuration directory *(e.g. D:\myapp\conf)*

```gosu
Configuration.get("D:\myapp\conf", "Server", "Test", Prop1")
```

## License

This project is licensed under the MIT License - see the [LICENSE.md](LICENSE.md) file for details

## [Build](BUILD.md)

## [Changelog](CHANGELOG.md)

## Author

* Ronaldo Webb
