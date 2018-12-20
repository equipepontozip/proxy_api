import json
from urllib import request

import pandas as pd
from flask import Flask
from flask import jsonify, render_template

app = Flask(__name__,template_folder='./static')
ORIGINAL_URL='http://00224.transdatasmart.com.br:22401/ITS-infoexport/api/Data/VeiculosGTFS'

def get_data():
    req = request.Request(ORIGINAL_URL, method='GET')
    app.logger.info('Requesting on %s' % ORIGINAL_URL)

    response = request.urlopen(req)
    body = response.read().decode('utf-8')
    body = json.loads(body)

    df = pd.DataFrame.from_records(body['Dados'], columns=body['Campos'])

    df = process_data(df)

    return df.to_dict(orient='records')

def convert_lat_long(df):
    df['GPS_Latitude'] = df['GPS_Latitude'].replace(',', '.')
    df['GPS_Longitude'] = df['GPS_Longitude'].replace(',', '.')

    return df

def process_data(df):
    df = df.apply(convert_lat_long, axis=1)
    df.GPS_Latitude = df.GPS_Latitude.astype(float)
    df.GPS_Longitude = df.GPS_Longitude.astype(float)

    return df

@app.route('/')
def root():
    #return json.dumps({'success':True}), 200, {'ContentType':'application/json'} 
    return render_template('index.html')
    


@app.route("/data")
def proxy():

    original_resp = get_data()
    response = jsonify(original_resp)

    return response, 200, {'ContentType':'application/json'}

@app.route('/teste')
def teste():
    return json.dumps({'success':True}), 200, {'ContentType':'application/json'} 