#!/usr/bin/env python3
import os, uuid
from flask import Flask
from flask import Flask, request, url_for, render_template, jsonify
from flask_cors import CORS
from ceramic_db import CeramicDB
from api_github import ApiGithub
import json
import requests

app = Flask(__name__)
CORS(app)

script_dir = os.path.dirname(os.path.realpath(__file__))
os.chdir(script_dir)

@app.route("/")
def razor():
    result_string = "Server is up"
    return result_string 

@app.route("/api/rate", methods=['GET', 'POST'])
def api_rate():
    """
    API endpoint for rating data models

    returns:
        {
          'success': ,     // boolean
          'reason':        // An string error code like 'error-syntax-error'
          'resp': {
          }      
        }
    """
    status = 200
    success = True
    reason = 'ok'
    resp = {}

    if request.method == 'GET':
        userid = request.args.get('userid')

        if userid:
            cdb = CeramicDB()
            ratings = cdb.get_user_ratings(userid)
            resp = ratings
        else:
            success = False
            status = 400
            reason = 'error-empty-userid'

    elif request.method == 'POST':
        body = request.json

        userid = body.get('userid', '').strip()
        modelid = body.get('modelid', '').strip()
        rating_str = body.get('rating', '').strip()
        comment = body.get('comment', '').strip()

        if not userid:
            success = False
            status = 400
            reason = 'error-empty-userid'
        elif not modelid:
            success = False
            status = 400
            reason = 'error-empty-userid'
        else:
            rating = 10
            try:
                rating = int(rating_str)
            except Exception as e:
                success = False
                status = 400
                reason = 'error-invalid-rating'

            if success:
                cdb = CeramicDB()
                try:
                    cdb.rate(userid, modelid, rating, comment)
                except Exception as e:
                    success = False
                    status = 400
                    reason = 'error-running-query'

    response = jsonify({'success': success, 'reason': reason, 'data': resp})

    origin = request.headers.get('Origin', '')
    origin_no_port = ':'.join(origin.split(':')[:2])

    allow_origin_list = ['https://aqua-explore.web.app', 'https://34.77.88.57']

    if 'localhost' in request.base_url:
        allow_origin_list = ['http://localhost']

    if origin_no_port in allow_origin_list:
        response.headers.add('Access-Control-Allow-Origin', origin)

    return response, status

@app.route("/api/update_models", methods=['POST'])
def api_update_models():
    """
    API endpoint for updating data model information from github

    returns:
        {
          'success': ,     // boolean
          'reason':        // An string error code like 'error-syntax-error'
          'resp': {
          }      
        }
    """
    status = 200
    success = True
    reason = 'ok'
    resp = {}

    cdb = CeramicDB()

    model_rows = cdb.get_models()
    model_id = []

    for model_row in model_rows:
        model_ids.append(model_row[0])

    apiGithub = ApiGithub('ceramicstudio', 'datamodels')
    
    dataModelsRepo = apiGithub.getRepositoryInfo()
    print(dataModelsRepo)

    tree = apiGithub.lsTree()
    packagesFolder = list(filter(lambda x: x['path'] == 'packages', tree))
    packagesURL = packagesFolder[0]['url']
    print('url', packagesURL)

    get_model_info()

    response = jsonify({'success': success, 'reason': reason, 'data': resp})

    origin = request.headers.get('Origin', '')
    origin_no_port = ':'.join(origin.split(':')[:2])

    allow_origin_list = ['https://aqua-explore.web.app', 'https://34.77.88.57']

    if 'localhost' in request.base_url:
        allow_origin_list = ['http://localhost']

    if origin_no_port in allow_origin_list:
        response.headers.add('Access-Control-Allow-Origin', origin)

    return response, status

def get_model_info():
    apiGithub = ApiGithub('ceramicstudio', 'datamodels')
    
    dataModelsRepo = apiGithub.getRepositoryInfo()
    print(dataModelsRepo)

    tree = apiGithub.lsTree()
    packagesFolder = list(filter(lambda x: x['path'] == 'packages', tree))
    packagesURL = packagesFolder[0]['url']
    print('url', packagesURL)

    j = apiGithub.get(packagesURL)

    dataModels = j['tree']

    for model in dataModels:
        print('Model: ', model['path'], model['url']);
        rawContentURL = apiGithub.getRawContentURL('main', f'packages/{model["path"]}/package.json')
        r = requests.get(rawContentURL)
        j = r.json()
        print(j)

        rawReadmeURL = apiGithub.getRawContentURL('main', f'packages/{model["path"]}/README.md');
        tReadme = requests.get(rawReadmeURL)
        print(tReadme)

        schemasFolderBase = f'packages/{model["path"]}/schemas'
        schemasFolder = list(filter(lambda x: x['path'].startswith(schemasFolderBase), tree))

        for item in schemasFolder:
            schemaFile = item['path'].replace(schemasFolderBase, '')
            
            if schemaFile:
                rawSchemaURL = apiGithub.getRawContentURL('main', f'{item["path"]}')
                print(rawSchemaURL);
                rSchema = requests.get(rawSchemaURL)
                tSchema = rSchema.json()
                print(tSchema)

if __name__ == '__main__':
    app.run(debug=True, host='0.0.0.0', port=8878)
