                // Access the classified code sections as needed
let definePartCode = [];
let customFunctions = [];
let setupCodeIno = [];
let loopCodeIno = [];


function classifyArduinoCode(arduinoCode) {
    // Initialize variables to store code sections
    let definePart = [];
   
    let customFunctions = {};

  
    // Split the code into lines
    const lines = arduinoCode.split('\n');
    let currentSection = null;
    let currentFunctionName = null;
  
    // Iterate through each line
    for (const line of lines) {
        const trimmedLine = line.trim();
        if (trimmedLine.startsWith("void ")) {
            // Assume user-defined functions start with "void"
            currentFunctionName = trimmedLine.split(' ')[1].split('(')[0];
            currentSection = "Custom Function";
            customFunctions[currentFunctionName] = [];
        } else if (trimmedLine.startsWith("void setup()")) {
            currentSection = "setup";
        } else if (trimmedLine.startsWith("void loop()")) {
            currentSection = "loop";
        } else if (currentSection === "Define Part") {
            definePart.push(line);
        } else if (currentSection === "Custom Function") {
            customFunctions[currentFunctionName].push(line);
        }
        if (trimmedLine.startsWith("#include") || trimmedLine.startsWith("#define")) {
            currentSection = "Define Part";
        }
    }
  
    // Join the code sections
    const definePartCode = definePart.join('\n');
    const setupCodeIno = customFunctions["setup"] ? customFunctions["setup"].join('\n') : '';
    const loopCodeIno = customFunctions["loop"] ? customFunctions["loop"].join('\n') : '';
    delete customFunctions["setup"];
    delete customFunctions["loop"];
  
    return {
        "Define Part": definePartCode,
        "Custom Functions": customFunctions,
        "setup": setupCodeIno,
        "loop": loopCodeIno,
    };
  }
  


var customFunctionCodeEditor = CodeMirror.fromTextArea(document.getElementById("custom_function_code"), {
    mode: "text/x-csrc",
    lineNumbers: true,
    theme: "lucario",
    extraKeys: {
        "F11": function(cm) {
          cm.setOption("fullScreen", !cm.getOption("fullScreen"));
        },
        "Esc": function(cm) {
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
            formData.appUrl = document.querySelector("#page1 input[placeholder='App Url']").value;
            formData.mqttUrl = document.querySelector("#page1 input[placeholder='Mqtt Url']").value;
            formData.mqttPort = document.querySelector("#page1 input[placeholder='Mqtt Port']").value;
            formData.mqttUsername = document.querySelector("#page1 input[placeholder='Mqtt Username']").value;
            formData.mqttPassword = document.querySelector("#page1 input[placeholder='Mqtt Password']").value;
            formData.wifiSSID = document.querySelector("#page1 input[placeholder='Wifi SSID']").value;
            formData.wifiPassword = document.querySelector("#page1 input[placeholder='Wifi Password']").value;
            formData.otaPassword = document.querySelector("#page1 input[placeholder='OTA Password']").value;
            formData.espType = document.querySelector("#page1 select").value;
            // formData.customFunctionCode = document.getElementById('custom_function_code').value;

              page1.style.display = "none";
              page2.style.display = "block";
              currentPage = 2;
              prevButton.style.display = "block"; // Show the "Previous" button
          } else if (currentPage === 2) {
              // Save value from page 2
                formData.customFunctionCode = customFunctionCodeEditor.getValue();

                // Classify Arduino Code
                const classifiedCode = classifyArduinoCode(formData.customFunctionCode);

                // Access the classified code sections as needed
                definePartCode = classifiedCode["Define Part"];
                customFunctions = classifiedCode["Custom Functions"];
                setupCodeIno = classifiedCode["setup"];
                loopCodeIno = classifiedCode["loop"];
                
                const defineLibrary = [];
                const definedPart = [];

                for (const line of definePartCode) {
                    const trimmedLine = line.trim();
                    if (trimmedLine.startsWith("#")) {
                        defineLibrary.push(line)
                    } else {
                        definedPart.push(line)
                    }
                }
                // Console log the classified code sections
                // console.log("Define Part Code:", definePartCode);
                // console.log("Custom Functions:", customFunctions);
                // console.log("Setup Code:", setupCodeIno);
                // console.log("Loop Code:", loopCodeIno);
                page2.style.display = "none";
                page3.style.display = "block";
                currentPage = 3;
                nextButton.style.display = "none"; // Hide the "Next" button on the last page
       


          
      let ino = `
      #ifdef ESP32
      #include <WiFi.h>
      #include <ESPmDNS.h>
      #include <HTTPClient.h>
      #include <ESP32httpUpdate.h>
      ${formData.espType === 'esp32' ? defineLibrary : ''}
      #else
      
      #include <ESP8266WiFi.h>
      #include <ESP8266mDNS.h>
      #include <ESP8266HTTPClient.h>
      #include <ESP8266httpUpdate.h>
      ${formData.espType === 'esp8266' ? defineLibrary : ''}
      #endif
      
      #include <WiFiUdp.h>
      #include <ArduinoOTA.h>
      
      //===========================>
      #include <PubSubClient.h>
      //<===========================
      #include <Wire.h>
      #include <SPI.h>
      // #include <Adafruit_Sensor.h>
      // #include <Adafruit_BME280.h>
      #include <ArduinoJson.h>
      //==================================================================
      #define ledPin 4
      // Adafruit_BME280 bme;
      
      #define SEALEVELPRESSURE_HPA (1013.25)
      ${formData.espType === 'esp8266' ? definePart : ''}
      
      
      float temperature, humidity, pressure, altitude;
      //====================================================================
      // Replace with your network credentials
      const char* ssid = "${formData.wifiSSID}";
      const char* password = "${formData.wifiPassword}";
      //====================================================================
      const char* mqtt_server = "${formData.mqttUrl}";
      const long mqtt_port = ${formData.port};
      //===================================================================
      const char* mqtt_user = "${formData.mqttUsername}";
      const char* mqtt_pass = "${formData.mqttPassword}";
      //==================================================================
      #ifdef ESP32
      String deviceName = "esp32";
      #else
      String deviceName = "esp8266";
      #endif
      
      String preName = "node";
      int number = ${formData.nodeNumber};
      const char* nodeName = (char*)(deviceName + preName + String(number)).c_str();
      //====================================================================
      //Firmware version
      float FW_VERSION = ${formData.firmwareVersion};
      String mac = "${formData.customMac}";
      // bool firmwareUpdate = false;
      String JsonConfig = preName + String(number) + ".json";
      
      //====================================================
      //URL Request
      const char* cfgUrlBase = "http://${formData.appUrl}/source/";
      
      const char* fwUrlBase = "http://${formData.appUrl}/source/bin/";
      
      //====================================================
      bool OTAupdate = true;
      #ifdef ESP32
      const char* host = "esp32";
      #else 
      const char* host = "esp8266";
      #endif
      const char* OTApassword = "${formData.otaPassword}";
      //<-----------------------------------------------------------
      long int counter = 0;
      bool unlock = false;
      //===========================================================>
      
      WiFiClient espClient;
      PubSubClient client(espClient);
      
      //****************************OPTIONAL***************************************************
      void update_started() {
        Serial.println("CALLBACK:  HTTP update process started");
        Serial.println((char*)(preName + String(number) + "/update/start").c_str());
        client.publish((char*)(preName + String(number) + "/update/start").c_str(), "Start");
      }
      void update_finished() {
        Serial.println("CALLBACK:  HTTP update process finished");
        client.publish((char*)(preName + String(number) + "/update/finished").c_str(), "Completed");
      }
      void update_progress(int cur, int total) {
        Serial.printf("CALLBACK:  HTTP update process at %d of %d bytes...\n", cur, total);
        static char totalTemp[11];
        dtostrf(total, 9, 0, totalTemp);
        client.publish((char*)(preName + String(number) + "/update/total").c_str(), totalTemp);
        static char progressTemp[11];
        dtostrf(cur, 9, 0, progressTemp);
        client.publish((char*)(preName + String(number) + "/update/progress").c_str(), progressTemp);
      }
      void update_error(int err) {
        Serial.printf("CALLBACK:  HTTP update fatal error code %d\n", err);
        client.publish((char*)(preName + String(number) + "/update/error").c_str(), "Error");
      }
      //*************************************************************************************
      //----------------------------------------------------------------------
      //LED indicator connection failed
      void ledBlink2() {
        digitalWrite(ledPin, HIGH);
        delay(250);
        digitalWrite(ledPin, LOW);
        delay(250);
      }
      //<-----------------------------------------------------------------
      //------------------------------------------------------------------>
      //Blink LED indicator for data send
      void ledBlink() {
        digitalWrite(ledPin, LOW);
        delay(1000);
        digitalWrite(ledPin, HIGH);
        delay(100);
        digitalWrite(ledPin, LOW);
        delay(100);
        digitalWrite(ledPin, HIGH);
        delay(100);
        digitalWrite(ledPin, LOW);
        delay(1000);
      }
      //<------------------------------------------------------------------
      //------------------------------------------------------------------>
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
        //int slen = s.length();
        macAddr = &s[0];
        //get Local IP
        String ss = WiFi.localIP().toString();
        //int sslen = ss.length();
        ipAddr = &ss[0];
        //get RSSI WiFi
        long rssi = WiFi.RSSI();
        static char rssiTemp[7];
        dtostrf(rssi, 5, 2, rssiTemp);
      
      
        //***************************************************************************
        //Publish to Broker
        client.publish((char*)(preName + String(number) + "/ip_addr").c_str(), ipAddr);
        client.publish((char*)(preName + String(number) + "/rssi").c_str(), rssiTemp);
        client.publish((char*)(preName + String(number) + "/ssid").c_str(), ssid);
        client.publish((char*)(preName + String(number) + "/version").c_str(), versionTopic);
        client.publish((char*)(preName + String(number) + "/node").c_str(), nodeNameTopic);
        client.publish((char*)(preName + String(number) + "/mac_addr").c_str(), mac.c_str());
        client.publish((char*)(preName + String(number) + "/unlockstatus").c_str(), unlockString.c_str());
      
        //***************************************************************************
      
        // Serial.println(macAddr);
        // Serial.println(ipAddr);
        // Serial.println(rssiTemp);
        // Serial.println(ssid);
        // Serial.println(FW_VERSION);
      }
      
      //============================================================>
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
        //****************************************************************
      
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
        //****************************************************************
      
      
        //*********************Unlock************************************
        if (topic == (preName + String(number) + "/unlock")) {
      
          unlock = true;
          Serial.print("Unlock");
        }
        
        
      
        //************************Custom Update********************************
      
        if (topic == (preName + String(number) + "/updateCustom")) {
          if (unlock) {
            unlock = false;
            firmwareCustomUpdate(messageTemp);
          }
        }
      
      //<========================================================
      Serial.println();
      }
      //=========================================================>
      //MQTT Reconnect
      void reconnect() {
        while (!client.connected()) {
          Serial.print("Attempting MQTT connection...");
          ledBlink();
          if (client.connect(nodeName, mqtt_user, mqtt_pass)) {
            client.subscribe((char*)(preName + String(number) + "/restart").c_str());
            client.subscribe((char*)(preName + String(number) + "/update").c_str());
            client.subscribe((char*)(preName + String(number) + "/unlock").c_str());
            client.subscribe((char*)(preName + String(number) + "/updateCustom").c_str());
            Serial.println(nodeName);
            Serial.println("connected");
          } else {
            Serial.print("failed, rc=");
            Serial.print(client.state());
            Serial.println(" try again in 5 seconds");
            delay(500);
          }
        }
      }
      
      //<====================================================
      void otaUpdate() {
      //********************OTA Update****OPTIONAL******************
      #ifdef ESP32
        ArduinoOTA.setPort(3232);
      #else
        // Port defaults to 8266
        ArduinoOTA.setPort(8266);
      #endif
        ArduinoOTA.setHostname(host);
        // No authentication by default
        ArduinoOTA.setPassword((const char*)OTApassword);
        //**************************************************
        //=======================================================================================
        ArduinoOTA.onStart([]() {
          Serial.println("Start");
        });
        ArduinoOTA.onEnd([]() {
          Serial.println("\nEnd");
        });
        ArduinoOTA.onProgress([](unsigned int progress, unsigned int total) {
          Serial.printf("Progress: %u%%\r", (progress / (total / 100)));
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
        // Connect to HTTP server
        HTTPClient http;
        Serial.print("[HTTP] begin...\n");
      
        if (http.begin(client, cfgUrlBase + JsonConfig)) {  // HTTP
          Serial.print("[HTTP] GET...\n");
          // start connection and send HTTP header
          int httpCode = http.GET();
          Serial.print("HTTP Code : ");
          Serial.println(httpCode);
          // httpCode will be negative on error
          if (httpCode > 0) {
            // HTTP header has been send and Server response header has been handled
            Serial.printf("[HTTP] GET... code: %d\n", httpCode);
            //-------------------------------------------------------------------------------
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
              // Extract values
              Serial.println(F("Response:"));
              Serial.println(doc["main"].as<String>());
              Serial.println(doc["mc_restart"].as<String>());
              Serial.println(doc["sensor_value"].as<String>());
              Serial.println(doc["firmware"].as<String>());
      
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
      
      
      // t_httpUpdate_return ret = ESPhttpUpdate.update(client,fwImageURL);
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
                  //******************OPTIONAL******************************
                  ESPhttpUpdate.setLedPin(LED_BUILTIN, LOW);
                  ESPhttpUpdate.onStart(update_started);
                  ESPhttpUpdate.onEnd(update_finished);
                  ESPhttpUpdate.onProgress(update_progress);
                  ESPhttpUpdate.onError(update_error);
                  //****************************************
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
                  Serial.println("------------------------------");
                }
              } else {
                Serial.print("Firmware version check failed, got HTTP response code ");
                Serial.println(httpCode);
              }
            }
            //-------------------------------------------------------------------------------
          } else {
            Serial.printf("[HTTP] GET... failed, error: %s\n", http.errorToString(httpCode).c_str());
          }
          http.end();
        } else {
          Serial.println("[HTTP] Unable to connect");
        }
        //========================End Code Update=====================================================
      }
      
      
      //=====================================Custom Update Code================================================
      void firmwareCustomUpdate(String customVersion) {
        WiFiClient client;
        // Connect to HTTP server
        HTTPClient http;
        Serial.print("[HTTP] begin...\n");
      
        String fwURLBase = String(fwUrlBase);
        fwURLBase.concat(mac);
      
      
        String fwImageURL = fwURLBase + "_" + customVersion + ".bin/download";
        Serial.print("Custom firmware version: ");
        Serial.println(customVersion);
        Serial.print("Custom firmware update URL: ");
        Serial.println(fwImageURL);
      
      // Perform the custom firmware update here
      // You can use the existing update code with the custom URL
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
        //******************OPTIONAL******************************
        ESPhttpUpdate.setLedPin(LED_BUILTIN, LOW);
        ESPhttpUpdate.onStart(update_started);
        ESPhttpUpdate.onEnd(update_finished);
        ESPhttpUpdate.onProgress(update_progress);
        ESPhttpUpdate.onError(update_error);
        //****************************************
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
      
      //=====================================Custom Update Code End================================================
      
      ${customFunctions}
      
      //==============================================================
      void setup() {
        // ESP.eraseConfig();
        Serial.begin(115200);
        Serial.println("Booting");
        WiFi.mode(WIFI_STA);
        WiFi.hostname(nodeName);
        ${setupCodeIno}
        WiFi.begin(ssid, password);
      
        while (WiFi.waitForConnectResult() != WL_CONNECTED) {
          Serial.println("Connection Failed! Rebooting...");
          delay(500);
          ledBlink();
          ESP.restart();
        }
      
        //================================================>
        Serial.println("");
        Serial.print("WiFi connected - ESP IP address: ");
      
      
        Serial.println(WiFi.localIP());
        //<================================================
      
        if (OTAupdate == true) {
          otaUpdate();
        }
      
        Serial.println("Ready");
        Serial.print("IP address: ");
        Serial.println(WiFi.localIP());
        //========================================================================================
        pinMode(ledPin, OUTPUT);
      
      // Wire.begin(D2, D1);//SDA and SCL
      #ifdef ESP32
        Wire.begin(2, 1);  //SDA and SCL
      #else
        Wire.begin(D2, D1);  //SDA and SCL
      #endif
        //===================================>
        client.setServer(mqtt_server, mqtt_port);
        client.setCallback(callback);
        reconnect();
        //<===================================
      }
      
      //==========================================================
      void loop() {
        //=======================================
        if (OTAupdate == true) {
          ArduinoOTA.handle();
        }
        //=======================================>
        if (!client.connected()) {
          reconnect();
        }
        if (!client.loop())
          client.connect(nodeName);
      
        delay(100);
        // readBME280();//BME280
        getESPInfo();  //ESP Info
        delay(100);
        ledBlink2();  //LED indicator
        delay(100);
      
        ${loopCodeIno}
      }
      //------------------------------------
      
            `
        console.log(ino)
    }
      });

      prevButton.addEventListener("click", function () {
          if (currentPage === 2) {
              page2.style.display = "none";
              page1.style.display = "block"; // Fixed typo: "style display" should be "style.display"
              currentPage = 1;
              nextButton.style.display = "block"; // Show the "Next" button
              prevButton.style.display = "none"; // Hide the "Previous" button on the first page
          } else if (currentPage === 2) {
              page3.style.display = "none";
              page2.style.display = "block";
              currentPage = 2;
              nextButton.style.display = "block"; // Show the "Next" button
          }
      });


  });


