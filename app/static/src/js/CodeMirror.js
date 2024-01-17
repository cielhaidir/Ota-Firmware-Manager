
var customFunctionCodeEditor = CodeMirror.fromTextArea(document.getElementById("custom_function_code"), {
  mode: "text/x-csrc",
  lineNumbers: true,
  theme: "lucario",
  extraKeys: {
    "F11": function (cm) {
      cm.setOption("fullScreen", !cm.getOption("fullScreen"));
    },
    "Esc": function (cm) {
      if (cm.getOption("fullScreen")) cm.setOption("fullScreen", false);
    }
  },
});

document.addEventListener("DOMContentLoaded", function () {
  const page1 = document.getElementById("page1");
  const page2 = document.getElementById("page2");
  const page3 = document.getElementById("page3");
  const nextButton = document.getElementById("nextButton");
  const prevButton = document.getElementById("prevButton");

  let currentPage = 1;
  let formData = {
    nodeNumber: "",
    customMac: "",
    firmwareVersion: "",
    appUrl: "",
    mqttUrl: "",
    mqttPort: "",
    mqttUsername: "",
    mqttPassword: "",
    wifiSSID: "",
    wifiPassword: "",
    otaPassword: "",
    espType: "",
    customFunctionCode: "",
  };




  nextButton.addEventListener("click", function () {
    if (currentPage === 1) {
      formData.uuid = document.querySelector("#page1 input[name='uuid']").value;
      formData.appUrl = document.querySelector("#page1 input[placeholder='App Url']").value;
      formData.nodeNumber = document.querySelector("#page1 input[placeholder='Node Number']").value;
      formData.firmwareVersion = document.querySelector("#page1 input[placeholder='Firmware Version']").value;
      formData.mqttUrl = document.querySelector("#page1 input[placeholder='Mqtt Url']").value;
      formData.mqttPort = document.querySelector("#page1 input[placeholder='Mqtt Port']").value;
      formData.mqttUsername = document.querySelector("#page1 input[placeholder='Mqtt Username']").value;
      formData.mqttPassword = document.querySelector("#page1 input[placeholder='Mqtt Password']").value;
      formData.customMac = document.querySelector("#page1 input[placeholder='Custom Mac']").value;
      formData.wifiSSID = document.querySelector("#page1 input[placeholder='Wifi SSID']").value;
      formData.wifiPassword = document.querySelector("#page1 input[placeholder='Wifi Password']").value;
      formData.otaPassword = document.querySelector("#page1 input[placeholder='OTA Password']").value;
      formData.espType = document.querySelector("#page1 select").value;

      console.log(formData.customMac);
     
      let ino = `#ifdef ESP32
  #include <WiFi.h>
  #include <ESPmDNS.h>
  #include <HTTPClient.h>
  #include <ESP32httpUpdate.h>
  // INPUT YOUR LIBARY HERE IF YOU USE ESP32 
  // 
#else
  #include <ESP8266WiFi.h>
  #include <ESP8266mDNS.h>
  #include <ESP8266HTTPClient.h>
  #include <ESP8266httpUpdate.h>
  // INPUT YOUR LIBARY HERE IF YOU USE ESP8266
  // 
#endif

#include <WiFiUdp.h>  
#include <ArduinoOTA.h>
#include <PubSubClient.h>
#include <Wire.h>
#include <SPI.h>
#include <ArduinoJson.h>
#include <WiFiManager.h> // https://github.com/tzapu/WiFiManager

//====================================================================
//                       DEFINED VARIABLE/OBJECT



//====================================================================
//                       NETWORK AND MQTT CREDENTIAL

const char* ssid = "${formData.wifiSSID}";
const char* password = "${formData.wifiPassword}";

const char* mqtt_server = "${formData.mqttUrl}";
const long mqtt_port = ${formData.mqttPort};

const char* mqtt_user = "${formData.mqttUsername}";
const char* mqtt_pass = "${formData.mqttPassword}";

//==================================================================
//  REMEMBER TO CHANGE THE VERSION IF YOU HAVE A NEWER FIRMWARE

#ifdef ESP32
  String deviceName = "esp32";
  const char* host = "esp32";
#else
  String deviceName = "esp8266";
  const char* host = "esp8266";
#endif

String id = "${formData.uuid}";
String preName = id + "_node";
int number = ${formData.nodeNumber};
const char* nodeName = (char*)(deviceName + preName + String(number)).c_str();
float FW_VERSION = ${formData.firmwareVersion};
String mac = "${formData.customMac}";
String JsonConfig = preName + String(number) + ".json";


const char* cfgUrlBase = "${formData.appUrl}/source/";
const char* fwUrlBase = "${formData.appUrl}/source/bin/";


const char* OTApassword = "${formData.otaPassword}";

bool unlock = false;
bool OTAupdate = true;

WiFiClient espClient;
PubSubClient client(espClient);

void update_error(int err) {
  Serial.printf("CALLBACK:  HTTP update fatal error code %d\\n", err);
  client.publish((char*)(preName + String(number) + "/update/error").c_str(), "Error");
}

//==================================================================
//ESP Information
void getESPInfo() {
  char* macAddr;
  char* ipAddr;
  char versionTopic[50];
  dtostrf(FW_VERSION, 4, 2, versionTopic);

  char nodeNameTopic[50];
  strcpy(nodeNameTopic, (preName + String(number)).c_str());
  String unlockString = unlock ? "true" : "false";
  //get MAC Address
  String s = WiFi.macAddress();
  macAddr = &s[0];
  //get Local IP
  String ss = WiFi.localIP().toString();
  ipAddr = &ss[0];
  //get RSSI WiFi
  long rssi = WiFi.RSSI();
  static char rssiTemp[7];
  dtostrf(rssi, 5, 2, rssiTemp);


  //Publish to Broker
  client.publish((char*)(preName + String(number) + "/ip_addr").c_str(), ipAddr);
  client.publish((char*)(preName + String(number) + "/rssi").c_str(), rssiTemp);
  client.publish((char*)(preName + String(number) + "/ssid").c_str(), ssid);
  client.publish((char*)(preName + String(number) + "/version").c_str(), versionTopic);
  client.publish((char*)(preName + String(number) + "/node").c_str(), nodeNameTopic);
  client.publish((char*)(preName + String(number) + "/mac_addr").c_str(), mac.c_str());
  client.publish((char*)(preName + String(number) + "/unlockstatus").c_str(), unlockString.c_str());

}


//MQTT callback function
void callback(String topic, byte* message, unsigned int length) {
  Serial.print("Message arrived on topic: ");
  Serial.print(topic);
  Serial.print(". Message: ");
  String messageTemp;

  for (int i = 0; i < length; i++) {
    Serial.print((char)message[i]);
    messageTemp += (char)message[i];
  }
  Serial.println();


  //*********************Restart************************************
  if (topic == (preName + String(number) + "/restart")) {
    Serial.print("Change restart to ");
    if (messageTemp == "1") {
      Serial.print("Restart");
      if (unlock == true) {
        unlock = false;
        ESP.restart();
      }
    }
  }

  //*********************Remote Update******************************
  if (topic == (preName + String(number) + "/update")) {
    Serial.print("Change update to ");
    if (messageTemp == "1") {
      Serial.print("Update ");
      if (unlock = -true) {
        unlock = false;
        firmwareRemoteUpdate();
      }
    }
  }

  //*********************Unlock************************************
  if (topic == (preName + String(number) + "/unlock")) {
    unlock = true;
    Serial.print("Unlock");
  }

  //*********************Custom Update**************

  if (topic == (preName + String(number) + "/updateCustom")) {
    if (unlock) {
      unlock = false;
      firmwareCustomUpdate(messageTemp);
    }
  }

//*********************Config Update**************
  if (topic == (preName + String(number) + "/updateconfig")) {
    Serial.print("Config Updated");
    getConfigFromServer();
  }

}

//MQTT Reconnect
void reconnect() {
  while (!client.connected()) {
    String clientId = generateRandomString(10);
    Serial.print("Attempting MQTT connection...");
    if (client.connect(clientId.c_str(), mqtt_user, mqtt_pass, NULL, NULL, NULL, NULL, 60)) {
      client.subscribe((char*)(preName + String(number) + "/restart").c_str());
      client.subscribe((char*)(preName + String(number) + "/update").c_str());
      client.subscribe((char*)(preName + String(number) + "/unlock").c_str());
      client.subscribe((char*)(preName + String(number) + "/updateCustom").c_str());
      client.subscribe((char*)(preName + String(number) + "/updateconfig").c_str());
      Serial.println(String(nodeName));
      Serial.println("connected");
    } else {
      Serial.print("failed, rc=");
      Serial.print(client.state());
      Serial.println(" try again in 5 seconds");
      delay(5000);
      ESP.restart();
    }
  }
}

//<======================================================
void otaUpdate() {
#ifdef ESP32
  ArduinoOTA.setPort(3232);
#else
  ArduinoOTA.setPort(8266);
#endif
  ArduinoOTA.setHostname(host);
  ArduinoOTA.setPassword((const char*)OTApassword);
  //**************************************************
  //=======================================================================================
  ArduinoOTA.onStart([]() {
    Serial.println("Start");
  });
  ArduinoOTA.onEnd([]() {
    Serial.println("\\nEnd");
  });
  ArduinoOTA.onProgress([](unsigned int progress, unsigned int total) {
    Serial.printf("Progress: %u%%\\r", (progress / (total / 100)));
  });
  ArduinoOTA.onError([](ota_error_t error) {
    Serial.printf("Error[%u]: ", error);
    if (error == OTA_AUTH_ERROR) Serial.println("Auth Failed");
    else if (error == OTA_BEGIN_ERROR) Serial.println("Begin Failed");
    else if (error == OTA_CONNECT_ERROR) Serial.println("Connect Failed");
    else if (error == OTA_RECEIVE_ERROR) Serial.println("Receive Failed");
    else if (error == OTA_END_ERROR) Serial.println("End Failed");
  });
  ArduinoOTA.begin();
}

void firmwareRemoteUpdate() {
  //========================Begin Code Update======================================
  WiFiClient client;
  HTTPClient http;
  Serial.print("[HTTP] begin...\\n");

  if (http.begin(client, cfgUrlBase + JsonConfig)) {  // HTTP
    Serial.print("[HTTP] GET...\\n");
    int httpCode = http.GET();
    Serial.print("HTTP Code : ");
    Serial.println(httpCode);
    if (httpCode > 0) {
      Serial.printf("[HTTP] GET... code: %d\\n", httpCode);
      // file found at server
      if (httpCode == HTTP_CODE_OK || httpCode == HTTP_CODE_MOVED_PERMANENTLY) {
        String payload = http.getString();
        Serial.println(payload);
        const size_t capacity = sizeof(payload) * JSON_OBJECT_SIZE(4) + JSON_ARRAY_SIZE(18) + 60;
        Serial.println(capacity);
        DynamicJsonDocument doc(capacity);

        //---------------------------------------------------------------------------------
        // Parse JSON object
        DeserializationError error = deserializeJson(doc, payload);
        if (error) {
          Serial.print(F("deserializeJson() failed: "));
          Serial.println(error.f_str());
          client.stop();
          return;
        }


        String fwURLBase = String(fwUrlBase);
        fwURLBase.concat(mac);
        String fwVersionURL = fwURLBase;
        fwVersionURL.concat(".version");

        Serial.println("------------------------------");
        Serial.println("Checking for firmware updates.");
        Serial.print("MAC address: ");
        Serial.println(mac);
        Serial.print("Firmware version URL: ");
        Serial.println(fwVersionURL);

        http.begin(client, fwVersionURL);
        int httpCode = http.GET();
        //Serial.println(httpCode);
        if (httpCode == 200) {
          String newVersion = http.getString();
          Serial.print("Current firmware version: ");
          Serial.println(FW_VERSION);
          Serial.print("Available firmware version: ");
          Serial.println(newVersion);

          if (newVersion.toFloat() > FW_VERSION) {
            //Prepare to update
            String fwImageURL = fwURLBase + "_" + newVersion + ".bin/download";
            Serial.print("Available Image firmware: ");
            Serial.println(fwImageURL);
            Serial.println("Please wait... firmware update progress");

          #ifdef ESP32
            t_httpUpdate_return ret = ESPhttpUpdate.update(fwImageURL);

            switch (ret) {
              case HTTP_UPDATE_FAILED:
                update_error(ESPhttpUpdate.getLastError());
                break;

              case HTTP_UPDATE_NO_UPDATES:
                Serial.println("HTTP_UPDATE_NO_UPDATES");
                break;

              case HTTP_UPDATE_OK:
                Serial.println("HTTP_UPDATE_OK");
                break;
            }

          #else
            t_httpUpdate_return ret = ESPhttpUpdate.update(client, fwImageURL);

          #endif

            switch (ret) {
              case HTTP_UPDATE_FAILED:
                Serial.printf("HTTP_UPDATE_FAILD Error (%d): %s", ESPhttpUpdate.getLastError(), ESPhttpUpdate.getLastErrorString().c_str());
                break;
              case HTTP_UPDATE_NO_UPDATES:
                Serial.println("HTTP_UPDATE_NO_UPDATES");
                break;
              case HTTP_UPDATE_OK:
                Serial.println("HTTP_UPDATE_OK");
                Serial.println("Update completed...");
                break;
            }

          } else {
            Serial.println("Already on latest version");
          }
        } else {
          Serial.print("Firmware version check failed, got HTTP response code ");
          Serial.println(httpCode);
        }
      }
      //-------------------------------------------------------------------------------
    } else {
      Serial.printf("[HTTP] GET... failed, error: %s\\n", http.errorToString(httpCode).c_str());
    }
    http.end();
  } else {
    Serial.println("[HTTP] Unable to connect");
  }
}


//=====================================Custom Update Code================================================
void firmwareCustomUpdate(String customVersion) {
  WiFiClient client;
  HTTPClient http;
  Serial.print("[HTTP] begin...\\n");

  String fwURLBase = String(fwUrlBase);
  fwURLBase.concat(mac);

  String fwImageURL = fwURLBase + "_" + customVersion + ".bin/download";
  Serial.print("Custom firmware version: ");
  Serial.println(customVersion);
  Serial.print("Custom firmware update URL: ");
  Serial.println(fwImageURL);

  // Perform the custom firmware update here
  #ifdef ESP32
    t_httpUpdate_return ret = ESPhttpUpdate.update(fwImageURL);

  switch (ret) {
    case HTTP_UPDATE_FAILED:
      update_error(ESPhttpUpdate.getLastError());
      break;

    case HTTP_UPDATE_NO_UPDATES:
      Serial.println("HTTP_UPDATE_NO_UPDATES");
      break;

    case HTTP_UPDATE_OK:
      Serial.println("HTTP_UPDATE_OK");
      break;
  }
  #else
    t_httpUpdate_return ret = ESPhttpUpdate.update(client, fwImageURL);
  #endif

  switch (ret) {
    case HTTP_UPDATE_FAILED:
      Serial.printf("HTTP_UPDATE_FAILED Error (%d): %s", ESPhttpUpdate.getLastError(), ESPhttpUpdate.getLastErrorString().c_str());
      break;

    case HTTP_UPDATE_NO_UPDATES:
      Serial.println("HTTP_UPDATE_NO_UPDATES");
      break;

    case HTTP_UPDATE_OK:
      Serial.println("HTTP_UPDATE_OK");
      Serial.println("Custom update completed...");
      break;
  }
}


//===========================================Config Update==================================================

void getConfigFromServer() {
    WiFiClient client;
    HTTPClient http;
    String config = "";

    if (http.begin(client, cfgUrlBase + JsonConfig)) {  // HTTP
        int httpCode = http.GET();
        
        if (httpCode > 0) {
            if (httpCode == HTTP_CODE_OK || httpCode == HTTP_CODE_MOVED_PERMANENTLY) {
                config = http.getString();
                // Serial.println(config);
                const size_t capacity = sizeof(config) * JSON_OBJECT_SIZE(4) + JSON_ARRAY_SIZE(18) + 60;
                Serial.println(capacity);
                DynamicJsonDocument doc(capacity);

                //---------------------------------------------------------------------------------
                // Parse JSON object
                DeserializationError error = deserializeJson(doc, config);
                if (error) {
                  Serial.print(F("deserializeJson() failed: "));
                  Serial.println(error.f_str());
                  client.stop();
                }
                /* THIS IS EXAMPLE OF DYNAMIC CONFIG
                Example case : Led or Sensor u want to turn on/off without changing the code
                */
                // if (doc["main"]["led"] == "ON") {
                  // Serial.println(doc["main"]["led"].as<String>());
                  // digitalWrite(LED_PIN, HIGH);
                // }
                // if (doc["main"]["led"] == "OFF") {
                  // Serial.println(doc["main"]["led"].as<String>());
                  // digitalWrite(LED_PIN, LOW);
                // }   
                // if (doc.containsKey("wifi")) {
                  //   ssid = doc["wifi"]["ssid"];
                  //   password = doc["wifi"]["password"];
                  //   Serial.println(ssid);
                  //   Serial.println(password);
                  //   WiFi.disconnect();
                  //   WiFi.begin(ssid, password);
                  // }
                // if (doc["main"]["sensor"] == "OFF") {
                  // Serial.println(doc["main"]["sensor"].as<String>());
                  // digitalWrite(PINOUTPUT_YANG_KE_VCC_SENSOR, LOW);
                // }     
                // if (doc["main"]["sensor"] == "ON") {
                  // Serial.println(doc["main"]["sensor"].as<String>());
                  // digitalWrite(PINOUTPUT_YANG_KE_VCC_SENSOR, LOW);
                // }     
            }
        }
        http.end();
    }
}

String generateRandomString(int length) {
  String characters = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  String randomString = "";

  for (int i = 0; i < length; i++) {
    int randomIndex = random(characters.length());
    randomString += characters.charAt(randomIndex);
  }

  return randomString;
}   



//==============================================================
// INPUT YOUR FUNCTION CODE HERE
  

  
// 
//==========================================================

void setup() {

  Serial.begin(115200);
  Serial.println("Booting");

  // WIFI MANAGER
  WiFiManager wm;
  WiFi.mode(WIFI_STA);
  WiFi.hostname(nodeName);
  bool res;
  
  while (WiFi.waitForConnectResult() != WL_CONNECTED) {
    Serial.println("Connection Failed!...");
    delay(500);
     res = wm.autoConnect(nodeName);
  }
  if(!res) {
      Serial.println("Failed to connect");
  } 
  else {
      //if you get here you have connected to the WiFi    
      Serial.println("connected...:)");
  }

  // Check Ota Update 
  if (OTAupdate == true) {
    otaUpdate();
  }

  Serial.println("Ready");
  Serial.print("IP address: ");
  Serial.println(WiFi.localIP());


  // MQTT
  client.setServer(mqtt_server, mqtt_port);
  client.setCallback(callback);
  reconnect();


  //==========================================================
  // INPUT YOUR SETUP CODE HERE
    


  // 
  //==========================================================
  getConfigFromServer();
}

//==========================================================
void loop() {

  if (OTAupdate == true) {
    ArduinoOTA.handle();
  }

  if (!client.connected()) {
    reconnect();
  }

  if (!client.loop()){
    client.connect(nodeName);
  }

  getESPInfo();
  delay(100);

  
  //==========================================================
  // INPUT YOUR Loop CODE HERE
    

    
  // 
  //==========================================================
}`

            


      customFunctionCodeEditor.setValue(ino);
      customFunctionCodeEditor.refresh();
      page1.style.display = "none";
      page2.style.display = "block";
      currentPage = 2;
      prevButton.style.display = "block"; // Show the "Previous" button
      nextButton.style.display = "none"; // Show the "Previous" button
    } 
  });

  prevButton.addEventListener("click", function () {
    if (currentPage === 2) {
      page2.style.display = "none";
      page1.style.display = "block"; // Fixed typo: "style display" should be "style.display"
      currentPage = 1;
      nextButton.style.display = "block"; // Show the "Next" button
      prevButton.style.display = "none"; // Hide the "Previous" button on the first page
      customFunctionCodeEditor.setValue("");
      customFunctionCodeEditor.refresh();
    }
  });

  document.getElementById("copyButton").addEventListener("click", function () {
    // Get the value from customFunctionCodeEditor
    var codeValue = customFunctionCodeEditor.getValue();

    // Create a textarea element to hold the code value
    var tempTextarea = document.createElement("textarea");
    tempTextarea.value = codeValue;

    // Append the textarea to the document
    document.body.appendChild(tempTextarea);

    // Select the text inside the textarea
    tempTextarea.select();

    // Execute the copy command
    document.execCommand('copy');

    // Remove the temporary textarea
    document.body.removeChild(tempTextarea);

    // Optionally, provide feedback to the user
    alert("Code copied to clipboard!");
});
});


var currentUrl = window.location.href;

// Extract the base URL (up to and including the port)
var baseUrl = currentUrl.split('/', 3).join('/');

// Set the value of the input field
document.getElementById('appurl').value = baseUrl;

document.getElementById('version').value = "1.0";
