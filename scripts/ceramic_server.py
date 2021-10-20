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

    allow_origin_list = ['https://ceramic-explore-ben-razor.vercel.app', 'https://ceramic-explore.vercel.app', 'https://34.77.88.57']

    if 'localhost' in request.base_url:
        allow_origin_list = ['http://localhost']

    if origin_no_port in allow_origin_list:
        response.headers.add('Access-Control-Allow-Origin', origin)

    return response, status


def get_model_info(existing_model_ids=[]):
    """
    Get the package.json, README.md and schemas from Github.

    param: existing_model_ids An array of model ids to ignore
    """
    apiGithub = ApiGithub('ceramicstudio', 'datamodels')

    tree = apiGithub.lsTree()
    packagesFolder = list(filter(lambda x: x['path'] == 'packages', tree))
    packagesURL = packagesFolder[0]['url']

    j = apiGithub.get(packagesURL) 

    dataModels = j['tree']

    new_model_infos = []

    for model in dataModels:
        model_id = model['path']

        if model_id in existing_model_ids:
            continue

        rawContentURL = apiGithub.getRawContentURL('main', f'packages/{model_id}/package.json')
        r = requests.get(rawContentURL)
        package_json = r.json()

        rawReadmeURL = apiGithub.getRawContentURL('main', f'packages/{model_id}/README.md');
        readme_md = requests.get(rawReadmeURL).text

        schemasFolderBase = f'packages/{model_id}/schemas'
        schemasFolder = list(filter(lambda x: x['path'].startswith(schemasFolderBase), tree))

        schemas = []
        for item in schemasFolder:
            schema_path = item['path']
            schema_file = schema_path.replace(schemasFolderBase, '')
            
            if schema_file:
                rawSchemaURL = apiGithub.getRawContentURL('main', f'{item["path"]}')
                rSchema = requests.get(rawSchemaURL)
                schema_json = rSchema.json()
                schemas.append({
                    'name': schema_file,
                    'path': schema_path,
                    'schema_json': schema_json 
                })

        new_model_infos.append({
            'model_id': model_id,
            'package_json': package_json,
            'readme_md': readme_md,
            'schemas': schemas
        })
    
    return new_model_infos

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
    existing_model_ids = []

    for model_row in model_rows:
        existing_model_ids.append(model_row[0])

    print('Existing model ids: ', existing_model_ids)

    new_model_infos = get_model_info(existing_model_ids)
    added_models = []

    for model_info in new_model_infos:
        model_id = model_info['model_id']
        package_json = model_info['package_json']
        readme_md = model_info['readme_md']
        schemas = model_info['schemas']

        try:
            cdb.add_model(
                model_id,
                package_json['version'],
                package_json['author'],
                ','.join(package_json['keywords']),
                readme_md,
                schemas
            )

            added_models.append(model_id)

        except Exception as e:
            print(e)

    resp = added_models
    response = jsonify({'success': success, 'reason': reason, 'data': resp})

    origin = request.headers.get('Origin', '')
    origin_no_port = ':'.join(origin.split(':')[:2])

    allow_origin_list = ['https://ceramic-explore-ben-razor.vercel.app', 'https://ceramic-explore.vercel.app', 'https://34.77.88.57']

    if 'localhost' in request.base_url:
        allow_origin_list = ['http://localhost']

    if origin_no_port in allow_origin_list:
        response.headers.add('Access-Control-Allow-Origin', origin)

    return response, status

@app.route("/api/search_models", methods=['GET'])
def api_search_models():
    """
    API endpoint for searching data models

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
        search = request.args.get('search', '')
        cdb = CeramicDB()
        resp = cdb.search_models(search)

    response = jsonify({'success': success, 'reason': reason, 'data': resp})

    origin = request.headers.get('Origin', '')
    origin_no_port = ':'.join(origin.split(':')[:2])

    allow_origin_list = ['https://ceramic-explore-ben-razor.vercel.app', 'https://ceramic-explore.vercel.app', 'https://34.77.88.57']

    if 'localhost' in request.base_url:
        allow_origin_list = ['http://localhost']

    if origin_no_port in allow_origin_list:
        response.headers.add('Access-Control-Allow-Origin', origin)

    return response, status

if __name__ == '__main__':
    app.run(debug=True, host='0.0.0.0', port=8878)
