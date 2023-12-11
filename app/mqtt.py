import paho.mqtt.client as mqtt
import os
from decouple import config

MQTT_BROKER_HOST = config('MQTT_BROKER_HOST')
MQTT_BROKER_PORT = int(config('MQTT_BROKER_PORT'))
MQTT_USERNAME = config('MQTT_USERNAME')
MQTT_PASSWORD = config('MQTT_PASSWORD')
SUBSCRIBE_TOPICS = config('SUBSCRIBE_TOPICS').split(', ')  

mqtt_data = {}

def on_message(client, userdata, message):
    topic = message.topic
    payload = message.payload.decode("utf-8")
    # print(topic)
    node_name = topic.split("/")[0]

    if node_name not in mqtt_data:
        mqtt_data[node_name] = {}
    field = topic.split("/")[1]
    mqtt_data[node_name][field] = payload


    # print(payload)

def on_connect(client, userdata, flags, rc):
    if rc == 0:
        print("Connected to MQTT broker")
        for topic in SUBSCRIBE_TOPICS:
            client.subscribe(topic)

    else:
        print(f"Connection to MQTT broker failed with error code {rc}")


mqttc = mqtt.Client()
mqttc.on_connect = on_connect
mqttc.on_message = on_message
mqttc.username_pw_set(MQTT_USERNAME, MQTT_PASSWORD)
mqttc.connect(MQTT_BROKER_HOST, MQTT_BROKER_PORT)
mqttc.loop_start()

