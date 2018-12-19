from flask import Flask
from flask import jsonify
from urllib import request
import json

app = Flask(__name__)
ORIGINAL_URL='http://00224.transdatasmart.com.br:22401/ITS-infoexport/api/Data/VeiculosGTFS'

def get_data():
    req = request.Request(ORIGINAL_URL, method='GET')
    app.logger.info('Requesting on %s' % ORIGINAL_URL)

    response = request.urlopen(req)
    body = response.read().decode('utf-8')

    js = json.loads(body)

    return js

@app.route("/")
def proxy():

    original_resp = get_data()
    response = jsonify(original_resp)

    return response
