from app import create_app
from decouple import config


SERVER_IP = config('SERVER_IP')
SERVER_PORT = int(config('SERVER_PORT'))

app = create_app()

if __name__ == '__main__':
    app.run(host=SERVER_IP, port=SERVER_PORT, debug=True)
