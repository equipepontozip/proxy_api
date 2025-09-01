import json
import ssl
import time
from urllib import request
import os
import pandas as pd
import numpy as np
from flask import Flask, jsonify, render_template

app = Flask(__name__,template_folder='./static')
FILTER = False


class DataCache:
    def __init__(self, cache_duration=5):
        self.data = None
        self.timestamp = 0
        self.cache_duration = cache_duration
    
    def is_valid(self):
        return self.data is not None and (time.time() - self.timestamp) < self.cache_duration
    
    def get(self):
        return self.data
    
    def set(self, data):
        self.data = data
        self.timestamp = time.time()


# Create cache instance
cache = DataCache(cache_duration=5)

# piracicabana
# ORIGINAL_URL='http://00224.transdatasmart.com.br:22401/ITS-infoexport/api/Data/VeiculosGTFS'

# pioneira
ORIGINAL_URL='https://www.sistemas.dftrans.df.gov.br/service/gps/operacoes'

def get_data():
    # Check if cache is valid
    if cache.is_valid():
        return cache.get()
    
    # Create unverified SSL context
    ssl_context = ssl.create_default_context()
    ssl_context.check_hostname = False
    ssl_context.verify_mode = ssl.CERT_NONE

    req = request.Request(ORIGINAL_URL, method='GET')
    app.logger.info('Requesting on %s' % ORIGINAL_URL)

    response = request.urlopen(req, context=ssl_context)
    body = response.read().decode('utf-8')
    body = json.loads(body)

#    df = pd.DataFrame.from_records(body['Dados'], columns=body['Campos'])
    df = pd.DataFrame()
    for operadora in body:
        df_temp = pd.DataFrame.from_records(operadora['veiculos'])
        df = pd.concat([df,df_temp], ignore_index=True)
    
    df = process_data(df)

    if(FILTER):
        df = apply_filters(df)

    # Update cache
    data = df.to_dict(orient='records')
    cache.set(data)
    
    return data

def process_data(df):
    #df = df.apply(convert_lat_long, axis=1)
    df_lat_long = df.localizacao.apply(pd.Series)
    df = df.merge(df_lat_long, on=df.index)
    
    # limpa campos com string vazia -> ""
    df['GPS_Latitude'] = df['latitude']
    df['GPS_Longitude'] = df['longitude']

    df['GPS_Latitude'].replace('', np.nan, inplace=True)
    df['GPS_Longitude'].replace('', np.nan, inplace=True)
    df = df.dropna(subset=['GPS_Latitude', 'GPS_Longitude'])

    df.GPS_Latitude = df.GPS_Latitude.astype(float)
    df.GPS_Longitude = df.GPS_Longitude.astype(float)
    df.drop(columns=['latitude','longitude','localizacao'], inplace=True)

    return df

def apply_filters(df):
    
    linhas = ['0.195', '147.5', '147.6', '180.1', '180.2', '181.2', '181.4', '8002','106.2','0.147','2207','2209']
    
    df = df[df.linha.isin(linhas)]
    
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

if __name__ == "__main__":
    port = int(os.environ.get("PORT", 5000))
    
    app.run(host="0.0.0.0", port=port, use_reloader=False)