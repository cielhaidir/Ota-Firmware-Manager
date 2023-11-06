from flask import Blueprint, jsonify, send_file, render_template, request, redirect, url_for
from werkzeug.utils import secure_filename
import os
import paho.mqtt.client as mqtt
from app.mqtt import mqtt_data,mqttc
from datetime import datetime
from packaging import version

main_bp = Blueprint('main', __name__)

SOURCE_FOLDER_PATH = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', 'source'))
def get_firmware_path(config):
    return os.path.join(SOURCE_FOLDER_PATH, config)

def get_version_file_path(firmware_version):
    return os.path.join(SOURCE_FOLDER_PATH, 'bin', firmware_version)

def version_is_greater(new_version, existing_version):
    # Parse the versions
    new_version = version.parse(new_version)
    existing_version = version.parse(existing_version)

    # Compare versions
    return new_version > existing_version

@main_bp.route("/")
def main():
    return render_template('index.html', mqtt_messages=mqtt_data)


# ======================================================== #
# ************************Callback************************ #


@main_bp.route('/update/<node>', methods=['GET'])
def updateLatest(node):
 
    mqtt_topic = f"{node}/update"
    mqtt_message = "1"  
    mqttc.publish(mqtt_topic, mqtt_message)
    return jsonify({"status": "success", "message": "Firmware update message sent."}), 200

@main_bp.route('/updateCustom/<node>/<version>', methods=['GET'])
def updateCustom(node,version):
 
    version_parts = version.rsplit('.', 1)
    version_number = version_parts[0]
    print(version_number)
    mqtt_topic = f"{node}/updateCustom"
    mqtt_message = version_number  
    mqttc.publish(mqtt_topic, mqtt_message)
    return jsonify({"status": "success", "message": "Firmware update message sent."}), 200


@main_bp.route('/restart/<node>', methods=['GET'])
def restart_node(node):
    mqtt_topic = f"{node}/restart"
    mqtt_message = "1"  
    mqttc.publish(mqtt_topic, mqtt_message, 0)
    print(mqtt_topic, mqtt_message)
    return jsonify({"status": "success", "message": "Device restart message sent."}), 200


@main_bp.route('/unlock/<node>', methods=['GET'])
def unlock_node(node):
 
    mqtt_topic = f"{node}/unlock"
    mqtt_message = "1"  # You can customize this message
    mqttc.publish(mqtt_topic, mqtt_message, 0)
    return jsonify({"status": "success", "message": "Firmware update message sent."}), 200


# ======================================================== #



# ========================================================================================== #
# ***************************************Routes Web***************************************** #

@main_bp.route('/source/<config>', methods=['GET'])
def check_config(config):
    firmware_path = get_firmware_path(config)
    if os.path.exists(firmware_path):
        return send_file(firmware_path, as_attachment=True)
    else:
        return jsonify({"status": "not_found", "message": "Firmware tidak ditemukan."}), 404


# ========================================================================================== #
# ***************************************Check Versi**************************************** #

@main_bp.route('/source/bin/<firmware_version>', methods=['GET'])
def check_firmware_version(firmware_version):
    version_file = get_version_file_path(firmware_version)
    if os.path.exists(version_file):
        with open(version_file, 'r') as file:
            firmware_text = file.read()
            return firmware_text, 200
    else:
        return jsonify({"status": "not_available", "message": "Firmware tidak tersedia."}), 404


# ============================================================================================ #
# ***************************************Download Bin***************************************** #

@main_bp.route('/source/bin/<firmware_version>/download', methods=['GET'])
def download_firmware(firmware_version):
    firmware_path = os.path.join(SOURCE_FOLDER_PATH, "bin", firmware_version)
    # print(firmware_path)
    if os.path.exists(firmware_path):
        return send_file(firmware_path, as_attachment=True, mimetype='main_bplication/octet-stream'), 200
    else:
        return jsonify({"status": "not_found", "message": "Firmware tidak ditemukan."}), 404



# ============================================================================================ #
# **********************************Show and Handle Upload************************************ #

@main_bp.route('/upload_firmware', methods=['GET', 'POST'])
def upload_firmware():
    if request.method == 'POST':
        if 'firmware_file' not in request.files:
            return jsonify({"status": "error", "message": "No file part"}), 400

        firmware_file = request.files['firmware_file']
        firmware_version = request.form.get('version')

        if firmware_file.filename == '' or not firmware_file.filename.endswith('.bin'):
            return jsonify({"status": "error", "message": "Invalid file format. Please upload a .bin file."}), 400

        if firmware_file:
            firmware_filename = secure_filename(firmware_file.filename)
            new_firmware_filename = f"{firmware_filename.split('.')[0]}_{firmware_version}.bin"
            firmware_path = os.path.join(SOURCE_FOLDER_PATH, "bin", new_firmware_filename)
            firmware_file.save(firmware_path)

            version_file_path = os.path.join(SOURCE_FOLDER_PATH, "bin", f"{firmware_filename.split('.')[0]}.version")
            with open(version_file_path, 'w') as version_file:
                version_file.write(firmware_version)

            return jsonify({"status": "success", "message": "Firmware file uploaded and renamed successfully."}), 200

    return render_template('upload_firmware.html')


# ============================================================================================ #


@main_bp.route('/save_config/<node_name>', methods=['POST'])
def save_config(node_name):
    config_content = request.form['config_content']
    with open(f'source/{node_name}.json', 'w') as config_file:
        config_file.write(config_content)
    return redirect(url_for('main.main'))

# ============================================================================================ #

@main_bp.route('/get_bin_files/<mac>')
def get_bin_files(mac):

    bin_dir = 'source/bin'

    bin_files = [f for f in os.listdir(bin_dir) if f.endswith('.bin') and f.startswith(f'{mac}_')]
    version_files = [f.replace(f'{mac}_', '') for f in bin_files]

    return jsonify(version_files)

# ============================================================================================ #


@main_bp.route('/upload/<node_name>', methods=['POST'])
def upload_bin_and_log(node_name):
    # Get the uploaded .bin file
    bin_file = request.files['file_upload']
    
    if bin_file:
        # Save the .bin file with the name mac_version_bin
        version = request.form.get('version')
        mac = request.form.get('mac')
        file_name = f'source/bin/{mac}_{version}.bin'
        bin_file.save(file_name)

        # Create or append to the node_name.log file with version, changelog, and date
        change_log = request.form.get('change_log')
        log_entry = f"Version: {version}\nChange Log: {change_log}\nDate: {datetime.now()}\n\n"
        
        with open(f'source/{node_name}.log', 'a') as log_file:
            log_file.write(log_entry)

        version_file_path = os.path.join(SOURCE_FOLDER_PATH, "bin", f"{mac.split('.')[0]}.version")

        if os.path.exists(version_file_path):
     
            with open(version_file_path, 'r') as version_file:
                existing_version = version_file.read()

            if version_is_greater(version, existing_version):
               
                with open(version_file_path, 'w') as version_file:
                    version_file.write(version)

        else :
            with open(version_file_path, 'w') as version_file:
                    version_file.write(version)
                    
    return redirect(url_for('main.main'))


# ============================================================================================ #


@main_bp.route('/get_change_log/<node_name>')
def get_change_log(node_name):
    try:
        with open(f'source/{node_name}.log', 'r') as log_file:
            log_content = log_file.read()
        return log_content
    except FileNotFoundError:
        return "Change log not available"