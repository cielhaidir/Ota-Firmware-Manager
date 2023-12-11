# main.py
from app import create_app
from flask import Flask
from decouple import config

app = create_app()

SERVER_IP = config('SERVER_IP')
SERVER_PORT = int(config('SERVER_PORT'))

if __name__ == '__main__':
    app.run(host=SERVER_IP, port=SERVER_PORT, debug=True)
