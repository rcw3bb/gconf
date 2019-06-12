package xyz.ronella.gosu.gconf

uses java.io.File
uses java.io.FileInputStream
uses java.net.URLEncoder
uses java.nio.file.Paths
uses java.text.SimpleDateFormat
uses java.util.concurrent.locks.Lock
uses java.util.concurrent.locks.ReentrantLock

uses org.slf4j.LoggerFactory

uses xyz.ronella.gosu.gcache.ConcurrentLRUCache

/**
 * @author Ron Webb
 * @since 2019-05-29
 */
class Configuration {

  public final static var LOG_CATEGORY(text: String) : String = \ _text -> "GConf.Util.${_text}"
  private final static var LOG = LoggerFactory.getLogger(LOG_CATEGORY("Configuration"))

  private final static var DEFAULT_CACHE_SIZE : int = 1000;

  private static final var CACHED_PROPERTIES : Map<String, Map<String, String>> = new ConcurrentLRUCache<String, Map<String,String>>("gconf.props", DEFAULT_CACHE_SIZE)
  private static final var PREFIX_DIRTY : Map<String, Boolean> = new ConcurrentLRUCache<String, Boolean>("gconf.dirty", DEFAULT_CACHE_SIZE/2)
  private static final var CONFIG_LAST_MODIFIED : Map<String, Long> = new ConcurrentLRUCache<String, Long>("gconf.last_modified", DEFAULT_CACHE_SIZE/2)
  private static final var PREFIX_FILE_MAPPING : Map<String, String> = new ConcurrentLRUCache<String, String>("gconf.file_mapping", DEFAULT_CACHE_SIZE/2)
  private static final var CURRENT_PROFILE : Map<String, String> = new ConcurrentLRUCache<String, String>("gconf.profile", 1)

  private static final var LOCK_CLASS : Lock = new ReentrantLock()

  private static var _monitorRunning : boolean

  protected var _prefix : String
  protected var _environment : String
  protected var _confDir : String

  public final static var DEFAULT_PREFIX : String = ConfigProps?.getString("DefaultPrefix")?:"application"
  public final static var DEFAULT_PROFILE : String = ConfigProps?.getString("DefaultProfile")?:""

  construct() {
    this(Configuration.DEFAULT_PREFIX)
  }

  construct(prefix : String) {
    this(prefix, "")
  }

  construct(prefix : String, profile : String) {
    this(DefaultConfDir, prefix, profile)
  }

  private static property get ConfigProps() : ResourceBundle {
    var confProps = Configuration.Class.getClassLoader().getResourceAsStream("gconf.properties")
    if (null == confProps) {
      return null
    }
    else {
      return new PropertyResourceBundle(confProps)
    }
  }

  public static property get DefaultConfDir() : String {
    var fromEnv = System.getenv("GCONF_DIR")
    var fromConf = fromEnv?:ConfigProps?.getString("ConfDir")?:Paths.get(".", {}).toAbsolutePath().toString()
    return fromConf
  }

  construct(confDir : String, prefix : String, environment : String) {
    this._confDir = "${confDir}"
    this._prefix = prefix
    this._environment = environment?:DEFAULT_PROFILE

    if (!_monitorRunning && (Boolean.valueOf(ConfigProps?.getString("Hot")?:"true"))) {
      using(LOCK_CLASS) {
        if (!_monitorRunning) {

          var monitor = new Thread("ConfigMonitor") {
            override function run() {
              while(true) {
                try {
                  CONFIG_LAST_MODIFIED.Keys?.each(\ ___filename -> {
                    LOG.trace(\ -> "Checking ${___filename} modification date.")
                    var prevLastModified = CONFIG_LAST_MODIFIED.get(___filename)
                    var lastModified = new File(___filename).lastModified()
                    if (prevLastModified != lastModified) {
                      using(LOCK_CLASS) {
                        prevLastModified = CONFIG_LAST_MODIFIED.get(___filename)
                        lastModified = new File(___filename).lastModified()
                        if (prevLastModified != lastModified) {
                          var ___prefix = PREFIX_FILE_MAPPING.get(___filename)
                          PREFIX_DIRTY.put(___prefix, true)
                        }
                      }
                    }
                  })
                }
                catch(ex : Exception) {
                  LOG.error(ex.StackTraceAsString)
                }
                finally {
                  Thread.sleep(Integer.valueOf(ConfigProps?.getString("ConfigMonitorDelay")?:"5") * 1000)
                }
              }
            }
          }

          monitor.start()
          _monitorRunning = true
        }
      }
    }
  }

  function configFiles() : List<String> {
    var confFiles : List<String> = {}

    var defaultConf = Paths.get(_confDir, {"${_prefix}.conf"}).toFile()
    if (defaultConf.exists()) {
      confFiles.add(defaultConf.AbsolutePath)
    }

    var envConf = Paths.get(_confDir, {"${_prefix}-${_environment}.conf"}).toFile()
    if (envConf.exists()) {
      confFiles.add(envConf.AbsolutePath)
    }

    var appData = System.getenv("APPDATA")
    var appDataConf = Paths.get(appData,{"gconf","${_prefix}-${_environment}.conf"}).toFile()
    if (appDataConf.exists()) {
      confFiles.add(appDataConf.AbsolutePath)
    }

    return confFiles
  }

  function loadProperties() : Map<String, String> {
    LOG.debug(\ -> "function loadProperties() : Map<String, String>")

    var props : Map<String, String>
    var isDirty : boolean

    if (_environment!=CURRENT_PROFILE.get("ENV")) {
      using(LOCK_CLASS) {
        if (_environment!=CURRENT_PROFILE.get("ENV")) {
          PREFIX_DIRTY.put(_prefix, true)
          CURRENT_PROFILE.put("ENV", _environment)
        }
      }
    }

    using(LOCK_CLASS) {
      props = CACHED_PROPERTIES.get(_prefix)
      isDirty = PREFIX_DIRTY.get(_prefix)
    }

    var encodeName = \ ___configFile : String -> {
      return URLEncoder.encode(___configFile, "UTF-8")
    }

    if (props==null || isDirty) {
      using (LOCK_CLASS) {
        isDirty = PREFIX_DIRTY.get(_prefix)
        props  = CACHED_PROPERTIES.get(_prefix)

        if (props==null || isDirty) {

          if (isDirty) {
            configFiles().each(\ ___configFile -> {
              var encodedName = encodeName(___configFile)
              CONFIG_LAST_MODIFIED.remove(encodedName)
              PREFIX_FILE_MAPPING.remove(encodedName)
            })
          }

          props = {}
          CACHED_PROPERTIES.put(_prefix, props)

          configFiles()?.each(\ ___configFile -> {
            var encodedName = encodeName(___configFile)
            LOG.debug(\ -> "Loading ${___configFile}")
            var resource = loadProperties(___configFile)
            resource?.Keys?.toList()?.each(\ ___key -> {
              var value = resource.getString(___key)
              LOG.trace("\t${___key}=${value}")
              props.put(___key, value)
            })
            CONFIG_LAST_MODIFIED.put(encodedName, new File(___configFile).lastModified())
            PREFIX_FILE_MAPPING.put(encodedName, _prefix)
          })

          PREFIX_DIRTY.put(_prefix, false)
        }
      }
    }

    return props.copy()
  }

  function getProp(prop : String) : String {
    return loadProperties()?.get(prop)?.trim()
  }

  function loadProperties(confFile : String) : ResourceBundle {
    var confFileInstance = new File(confFile)
    var properties : ResourceBundle

    if (confFileInstance.exists()) {
      using (LOCK_CLASS) {
        using (var fis = new FileInputStream(confFile)) {
          properties = new PropertyResourceBundle(fis)
        }
      }
    }

    return properties
  }

  static function clear(prefix : String) {
    if (PREFIX_DIRTY.Keys?.contains(prefix) && !PREFIX_DIRTY.get(prefix)) {
      using(LOCK_CLASS) {
        if (!PREFIX_DIRTY.get(prefix)) {
          PREFIX_DIRTY.put(prefix, true)
        }
      }
    }
  }

  static function get(confDir : String, prefix : String, profile : String, prop : String) : String {
    return new Configuration(confDir, prefix, profile).getProp(prop)
  }

  static function get(prefix : String, profile: String, prop : String) : String {
    return Configuration.get(Configuration.DefaultConfDir, prefix, profile, prop)
  }

  static function get(prefix : String, prop : String) : String {
    return Configuration.get(Configuration.DefaultConfDir, prefix, Configuration.DEFAULT_PROFILE, prop)
  }

  static function get(prop : String) : String {
    return Configuration.get(Configuration.DEFAULT_PREFIX, prop)
  }

  static function parseDate(strDate : String) : Date {
    var odbcFormat = "yyyy-MM-dd"
    return strDate==null ? null : new SimpleDateFormat(odbcFormat).parse(strDate)
  }

  static function getDate(confDir : String, prefix : String, environment : String, prop : String) : Date {
    return parseDate(Configuration.get(confDir, prefix, environment, prop))
  }

  static function getDate(prefix : String, env: String, prop : String) : Date {
    return parseDate(Configuration.get(Configuration.DefaultConfDir, prefix, env, prop))
  }

  static function getDate(prefix : String, prop : String) : Date {
    return parseDate(Configuration.get(prefix, Configuration.DEFAULT_PROFILE, prop))
  }

  static function getDate(prop : String) : Date {
    return parseDate(Configuration.get(Configuration.DEFAULT_PREFIX, prop))
  }
}
