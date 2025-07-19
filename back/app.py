from flask import Flask
from flask_cors import CORS
from flask_sqlalchemy import SQLAlchemy

app = Flask(__name__)
CORS(app, resources={r"/*": {"origins": "*"}})  # Adjust the origins as needed
app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///tms.db'
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
db = SQLAlchemy(app)

from back.route1 import *
from back.route2 import *
from back.route3 import *
from back.route4 import *
from back.route5 import *
from back.route6 import *
from back.route7 import *
from back.route8 import *
from back.route9 import *
from back.route10 import *
from back.route11 import *
from back.route12 import *
from back.route13 import *
from back.route14 import *
from back.route15 import *
from back.route16 import *
from back.route17 import *
from back.route18 import *
from back.route19 import *

if __name__ == "__main__":
    app.run(debug=True)
