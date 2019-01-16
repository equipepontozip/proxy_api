import json
from urllib import request

import pandas as pd
import numpy as np
from flask import Flask
from flask import jsonify, render_template

app = Flask(__name__,template_folder='./static')

# piracicabana
#piracicabana='http://00224.transdatasmart.com.br:22401/ITS-infoexport/api/Data/VeiculosGTFS'
# pioneira
pioneira='http://00078.transdatasmart.com.br:7801/ITS-InfoExport/api/Data/VeiculosGTFS'

#urls = [pioneira,piracicabana]
urls = [pioneira]

def get_data():

    df = pd.DataFrame()

    for url in urls:
        req = request.Request(url, method='GET')
        app.logger.info('Requesting on %s' % url)
        response = request.urlopen(req)
        body = response.read().decode('utf-8')
        body = json.loads(body)
        url_df = pd.DataFrame.from_records(body['Dados'], columns=body['Campos'])
        url_df = process_data(url_df)

    df.append(url_df)
    print(df.columns)
    print(url_df)
    
    return df.to_dict(orient='records')

def convert_lat_long(df):
    df['GPS_Latitude'] = df['GPS_Latitude'].replace(',', '.')
    df['GPS_Longitude'] = df['GPS_Longitude'].replace(',', '.')

    return df

def process_data(df):
    df = df.apply(convert_lat_long, axis=1)
    
    # limpa campos com string vazia -> ""
    df['GPS_Latitude'].replace('', np.nan, inplace=True)
    df['GPS_Longitude'].replace('', np.nan, inplace=True)
    df = df.dropna(subset=['GPS_Latitude', 'GPS_Longitude'])

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

import os
port = int(os.environ.get("PORT", 5000))
app.run(host='0.0.0.0', port=port)