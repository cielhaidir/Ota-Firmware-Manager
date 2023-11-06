from flask import Flask

def create_app():
    app = Flask(__name__, template_folder='../views', static_folder='static')
    # app = Flask(__name__, template_folder='C:/Users/saidh/Downloads/Ngota/OtaUpdate2/views')
    
    from app.routes import main_bp
    app.register_blueprint(main_bp)

    return app
