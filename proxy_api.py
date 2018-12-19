from flask import Flask
from flask import jsonify
import requests

app = Flask(__name__)
ORIGINAL_URL='http://00224.transdatasmart.com.br:22401/ITS-infoexport/api/Data/VeiculosGTFS'

@app.route("/")
def proxy():
    original_resp = requests.get(ORIGINAL_URL)
    response = jsonify(original_resp.json())
    response.status_code = original_resp.status_code

    return response
