def classify_arduino_code(arduino_code):
    # Initialize dictionaries to store code sections
    define_part = []
    custom_functions = {}
    setup_code = []
    loop_code = []

    # Split the code into lines
    lines = arduino_code.split('\n')
    current_section = None

    # Iterate through each line
    for line in lines:
        line = line.strip()
        # if line.startswith("#include") or line.startswith("#define"):
        #     current_section = "Define Part"
        if line.startswith("void "):
            # Assume user-defined functions start with "void"
            function_name = line.split(' ')[1].split('(')[0]
            current_section = "Custom Function"
            custom_functions[function_name] = []
        elif line.startswith("void setup()"):
            current_section = "setup"
        elif line.startswith("void loop()"):
            current_section = "loop"
        elif current_section:
            if current_section == "Define Part":
                define_part.append(line)
            elif current_section == "Custom Function":
                custom_functions[function_name].append(line)
        if line.startswith("#include") or line.startswith("#define"):
            current_section = "Define Part"

    # Join the code sections
    define_part_code = '\n'.join(define_part)
    custom_functions_code = {func: '\n'.join(code) for func, code in custom_functions.items()}
    setup_code = custom_functions_code.get("setup", [])
    loop_code = custom_functions_code.get("loop", [])
    custom_functions_code.pop("setup", [])
    custom_functions_code.pop("loop", [])
    return {
        "Define Part": define_part_code,
        "Custom Functions": custom_functions_code,
        "setup": setup_code,
        "loop": loop_code,
    }


# Example usage:
arduino_code = """
#include <DHT.h>
#include <Adafruit_BME280.h>
#include <ESP8266WiFi.h>
#include <PubSubClient.h>
#include <Adafruit_Sensor.h>

#define DHTPIN D7
#define DHTTYPE DHT22   // DHT 22  (AM2302), AM2321

#define MQTT_TOPIC_HUMIDITY "/node26/dht22/humidity"
#define MQTT_TOPIC_TEMPERATURE "/node26/dht22/temperature"
#define MQTT_TOPIC_BME_TEMPERATURE "/node26/bme280/temperature"
#define MQTT_TOPIC_BME_PRESSURE "/node26/bme280/pressure"
#define MQTT_TOPIC_BME_HUMIDITY "/node26/bme280/humidity"
#define MQTT_TOPIC_STATUS "/node26/status"
#define MQTT_PUBLISH_DELAY 10000
#define MQTT_CLIENT_ID "node26"

const char* WIFI_SSID = "deeznut";
const char* WIFI_PASSWORD = "demn1112";

const char *MQTT_SERVER = "192.168.25.164";
const long MQTT_PORT = 1883;
const char *MQTT_USER = "user0011"; 
const char *MQTT_PASSWORD = "123"; 

float humidity;
float temperature;

Adafruit_BME280 bme; // Buat objek BME280

long lastMsgTime = 0;

DHT dht(DHTPIN, DHTTYPE);

WiFiClient espClient;
PubSubClient mqttClient(espClient);

void readDHTSensor() {
  // Get temperature event and print its value.
  humidity = dht.readHumidity();
  temperature = dht.readTemperature();

  if (isnan(temperature) || isnan(humidity)) {
    humidity = 0;
    temperature = 0;
  } else {   
    Serial.print("DHT Temperature: ");     
    Serial.print(temperature);
    Serial.println(" *C");
    Serial.print("DHT Humidity: ");
    Serial.print(humidity);
    Serial.println("%");
  }  
}

void setupWifi() {
  Serial.print("Connecting to ");
  Serial.println(WIFI_SSID);

  WiFi.begin(WIFI_SSID, WIFI_PASSWORD);

  while (WiFi.status() != WL_CONNECTED) {
    delay(500);
    Serial.print(".");
  }
  Serial.println();
  Serial.println("WiFi connected");
  Serial.print("IP address: ");
  Serial.println(WiFi.localIP());
}

void mqttReconnect() {
  while (!mqttClient.connected()) {
    Serial.print("Attempting MQTT connection...");

    // Attempt to connect
    if (mqttClient.connect(MQTT_CLIENT_ID, MQTT_USER, MQTT_PASSWORD, MQTT_TOPIC_STATUS, 1, true, "offline")) {
      Serial.println("connected");
      mqttClient.publish(MQTT_TOPIC_STATUS, "online");
    } else {
      Serial.print("failed, rc=");
      Serial.print(mqttClient.state());
      Serial.println(" try again in 5 seconds");
      delay(5000);
    }
  }
}

void mqttPublish(char* topic, float payload) {
  Serial.print(topic);
  Serial.print(": ");
  Serial.println(payload);

  mqttClient.publish(topic, String(payload).c_str(), true);
}

void setup() {
  Serial.begin(115200); 
  pinMode(D5, INPUT);
 
  while (!Serial);

  setupWifi();
  mqttClient.setServer(MQTT_SERVER, MQTT_PORT);
  mqttClient.setKeepAlive(15);
  dht.begin();
  bme.begin(0x76); // Alamat I2C sensor BME280, sesuaikan dengan yang Anda gunakan
}

void loop() {
  if (!mqttClient.connected()) {
    mqttReconnect();
  }
  mqttClient.loop();
  long now = millis();

  if (now - lastMsgTime > MQTT_PUBLISH_DELAY) {
    lastMsgTime = now;
    readDHTSensor();
    
    // Membaca data dari sensor BME280
    float temperatureBME = bme.readTemperature();
    float pressure = bme.readPressure() / 100.0F; // Konversi ke hPa
    float humidityBME = bme.readHumidity();

    // Publishing sensor data
    mqttPublish(MQTT_TOPIC_TEMPERATURE, temperature);
    mqttPublish(MQTT_TOPIC_HUMIDITY, humidity);
    mqttPublish(MQTT_TOPIC_BME_TEMPERATURE, temperatureBME);
    mqttPublish(MQTT_TOPIC_BME_PRESSURE, pressure);
    mqttPublish(MQTT_TOPIC_BME_HUMIDITY, humidityBME);
    }
}
"""

code_sections = classify_arduino_code(arduino_code)
print("Define Part:")
print(code_sections["Define Part"])
# print("\nCustom Functions:")
# for func_name, func_code in code_sections["Custom Functions"].items():
#     # print(f"Function: {func_name}")
#     print(func_code)
# print("\nSetup:")
# print(code_sections["setup"])
# print("\nLoop:")
# print(code_sections["loop"])
