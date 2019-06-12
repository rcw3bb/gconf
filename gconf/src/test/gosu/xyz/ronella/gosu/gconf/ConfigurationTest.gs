package xyz.ronella.gosu.gconf

uses gw.testharness.RunLevel
uses gw.api.system.server.Runlevel
uses java.io.File
uses java.nio.file.Paths

@gw.testharness.ServerTest
@RunLevel(Runlevel.SHUTDOWN)
class ConfigurationTest extends gw.testharness.TestBase {

  private static final var CONF_DIR : String = Paths.get(".", {"modules", "configuration", "gtest", "xyz", "ronella", "gosu", "gconf"}).toString()

  override function beforeMethod() {
    super.beforeMethod()
    Configuration.clear("dummy")
  }

  function testConfigFiles() {
    print("CONF_DIR: " + CONF_DIR)
    var expectedConfFiles = {"dummy.conf", "dummy-ENV.conf"}
    var conf = new Configuration(CONF_DIR, "dummy", "ENV")
    var confFiles = conf.configFiles()

    (0..1).each(\ ___idx ->{
      assertTrue(confFiles[___idx].endsWith(expectedConfFiles[___idx]))
    })
  }

  function testLoadPropertiesByConfFile() {
    var conf = new Configuration(CONF_DIR, "dummy", "ENV")
    var confFiles = conf.configFiles()
    var properties = conf.loadProperties(confFiles[0])

    ({"prop1", "prop2"}).each(\ ___prop -> {
      assertTrue(properties.containsKey(___prop))
    })
  }

  function testLoadProperties() {
    var conf = new Configuration(CONF_DIR, "dummy", "ENV")
    var properties = conf.loadProperties()
    assertEquals("env-prop1", properties.get("prop1"))
    assertEquals("sys-prop2", properties.get("prop2"))
  }

  function testGetProp() {
    assertEquals("env-prop1", new Configuration(CONF_DIR, "dummy", "ENV").getProp("prop1"))
  }

  function testGet() {
    assertEquals("env-prop1", Configuration.get(CONF_DIR, "dummy", "ENV","prop1"))
  }

  function testNullEnv() {
    assertEquals("sys-prop1", new Configuration(CONF_DIR, "dummy", null).getProp("prop1"))
  }

  function testDefaultConfDir() {
    assertTrue(Configuration.DefaultConfDir.endsWith("gconf"))
    print(Configuration.DefaultConfDir)
  }
}
