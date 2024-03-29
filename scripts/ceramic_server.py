#!/usr/bin/env python3
import os, uuid
from flask import Flask
from flask import Flask, request, url_for, render_template, jsonify
from flask_cors import CORS
from ceramic_db import CeramicDB
from api_github import ApiGithub
from api_npm import ApiNPM
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
        rating_str = body.get('rating')
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
                    ratings = cdb.get_user_ratings(userid)
                    resp = ratings
                except Exception as e:
                    success = False
                    status = 400
                    reason = 'error-running-query: ' + str(e)

    response = jsonify({'success': success, 'reason': reason, 'data': resp})

    origin = request.headers.get('Origin', '')
    origin_no_port = ':'.join(origin.split(':')[:2])

    allow_origin_list = ['https://ceramic-explore-ben-razor.vercel.app', 'https://ceramic-explore.vercel.app', 'https://34.77.88.57']

    if 'localhost' in request.base_url:
        allow_origin_list = ['http://localhost']

    if origin_no_port in allow_origin_list:
        response.headers.add('Access-Control-Allow-Origin', origin)

    return response, status

def get_model_info(user_id, repo_id, model_id, branch_id):
    success = True 
    reason = ''
    new_model_info = {}

    try:
        apiGithub = ApiGithub(user_id, repo_id)
        tree = apiGithub.lsTree(branch=branch_id)

        rawContentURL = apiGithub.getRawContentURL(branch_id, f'packages/{model_id}/package.json')
        r = requests.get(rawContentURL)
        package_json = r.json()

        rawReadmeURL = apiGithub.getRawContentURL(branch_id, f'packages/{model_id}/README.md')
        readme_md = requests.get(rawReadmeURL).text

        schemasFolderBase = f'packages/{model_id}/schemas'
        print(tree)
        schemasFolder = list(filter(lambda x: x['path'].startswith(schemasFolderBase), tree))

        schemas = []
        for item in schemasFolder:
            schema_path = item['path']
            schema_file = schema_path.replace(schemasFolderBase, '')
            print('Path: ', schema_path)
            
            if schema_file:
                rawSchemaURL = apiGithub.getRawContentURL(branch_id, f'{item["path"]}')
                print('rsu', rawSchemaURL)
                rSchema = requests.get(rawSchemaURL)
                print('rsu got', rawSchemaURL)
                schema_json = rSchema.json()
                print('rsu json')
                schemas.append({
                    'name': schema_file,
                    'path': schema_path,
                    'schema_json': schema_json 
                })

        new_model_info = {
            'model_id': model_id,
            'package_json': package_json,
            'readme_md': readme_md,
            'schemas': schemas
        }

    except Exception as e:
        print(e)
        success = False
        reason  = str(e)

    return {
        'success': success,
        'reason': reason,
        'data': new_model_info
    }
 
def get_model_infos(existing_model_ids=[]):
    """
    Get the package.json, README.md and schemas from Github.

    param: existing_model_ids An array of model ids to ignore
    """
    user_id = 'ceramicstudio'
    repo_id = 'datamodels'

    apiGithub = ApiGithub(user_id, repo_id)

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

        result = get_model_info(user_id, repo_id, model_id, 'main')

        if result['success']:
            new_model_infos.append(result['data'])
    
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

    new_model_infos = get_model_infos(existing_model_ids)
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
                package_json,
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

def add_cors_headers(request, response):
    origin = request.headers.get('Origin', '')
    origin_no_port = ':'.join(origin.split(':')[:2])

    allow_origin_list = ['https://ceramic-explore-ben-razor.vercel.app', 'https://ceramic-explore.vercel.app', 'https://34.77.88.57']

    if 'localhost' in request.base_url:
        allow_origin_list = ['http://localhost']

    if origin_no_port in allow_origin_list:
        response.headers.add('Access-Control-Allow-Origin', origin)
    
    return response

@app.route("/api/get_model", methods=['GET'])
def api_get_model():
    """
    API endpoint for getting data for one data model

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
        model_id = request.args.get('modelid', '')
        cdb = CeramicDB()
        resp = cdb.get_model(model_id)

    response = jsonify({'success': success, 'reason': reason, 'data': resp})

    origin = request.headers.get('Origin', '')
    origin_no_port = ':'.join(origin.split(':')[:2])

    allow_origin_list = ['https://ceramic-explore-ben-razor.vercel.app', 'https://ceramic-explore.vercel.app', 'https://34.77.88.57']

    if 'localhost' in request.base_url:
        allow_origin_list = ['http://localhost']

    if origin_no_port in allow_origin_list:
        response.headers.add('Access-Control-Allow-Origin', origin)

    return response, status

@app.route("/api/get_model_ratings", methods=['GET']) 
def api_get_model_ratings():
    """
    API endpoint for getting data for one data model

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
    resp = cdb.get_ratings()

    response = jsonify({'success': success, 'reason': reason, 'data': resp})

    origin = request.headers.get('Origin', '')
    origin_no_port = ':'.join(origin.split(':')[:2])

    allow_origin_list = ['https://ceramic-explore-ben-razor.vercel.app', 'https://ceramic-explore.vercel.app', 'https://34.77.88.57']

    if 'localhost' in request.base_url:
        allow_origin_list = ['http://localhost']

    if origin_no_port in allow_origin_list:
        response.headers.add('Access-Control-Allow-Origin', origin)

    return response, status

@app.route("/api/stats", methods=['GET', 'POST'])
def api_stats():
    """
    API endpoint for getting stats for a model

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
        model_id = request.args.get('modelid', '')
        cdb = CeramicDB()

        if model_id:
            resp = cdb.get_stats(model_id)
        else:
            resp = cdb.get_all_stats()

    elif request.method == 'POST':
        body = request.json
        modelid = body.get('modelid', '').strip()
        packageid = body.get('packageid', '').strip()

        api_npm = ApiNPM()

        monthly_downloads = 0
        npm_score = 0
        npm_quality = 0
        num_streams = 0

        try:
            download_info = api_npm.getDownloads(packageid)
            monthly_downloads = download_info.get('downloads', 0)
        except:
            print('Could not retrieve num downloads')

        try:
            score_info = api_npm.getRegistryScore(packageid)
            npm_score = score_info.get('final', 0)
            npm_detail = score_info.get('detail', {})
            npm_quality = npm_detail.get('quality', 0)
        except:
            print('Could not retrieve registry score')

        cdb = CeramicDB()
        prev_stats = cdb.get_stats(modelid)
        resp = prev_stats

        if resp:
            monthly_downloads = monthly_downloads or resp[0]
            npm_score = npm_score or resp[1]
            npm_quality = npm_quality or resp[2]
            num_streams = num_streams or resp[3]

        cdb.add_stats(modelid, monthly_downloads, npm_score, npm_quality, num_streams)

        resp = cdb.get_stats(modelid)

    response = jsonify({'success': success, 'reason': reason, 'data': resp})
    response = add_cors_headers(request, response)

    return response, status

@app.route("/api/user_models", methods=['GET', 'POST'])
def api_user_models():
    """
    API endpoint for adding and retrieving user created models

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
        user_id = request.args.get('userid', '')
        cdb = CeramicDB()
        resp = cdb.get_user_models(user_id)

    elif request.method == 'POST':
        body = request.json
        modelid = body.get('modelid', '').strip()
        userid = body.get('userid', '').strip()
        npm_package = body.get('npmPackage', '').strip()
        repo_url = body.get('repoURL', '').strip()

        api_npm = ApiNPM()

        try:
            npm_info = api_npm.getRepoInfo(npm_package)

            repo_parts = repo_url.replace('https://', '').split('/')

            if len(repo_parts) < 7:
                success = False
                status = 400
                reason = 'error-repo-url-invalid'
            else:
                gh_user_id = repo_parts[1]
                gh_repo = repo_parts[2]
                gh_branch = repo_parts[4]
                gh_package = repo_parts[6]

                package_url = f'https://raw.githubusercontent.com/{gh_user_id}/{gh_repo}/{gh_branch}/packages/{gh_package}/package.json'
                print('Getting package json from', package_url)

                readme_url = f'https://raw.githubusercontent.com/{gh_user_id}/{gh_repo}/{gh_branch}/packages/{gh_package}/README.md'
                print('Getting readme from', readme_url)

                print(f'Attempting to get Github files for {gh_user_id}, {gh_repo}, {gh_package}, {gh_branch}')
                result = get_model_info(gh_user_id, gh_repo, gh_package, gh_branch)
                resp = result

                if result['success']:
                    model_info = result['data']

                    model_id = model_info['model_id']
                    package_json = model_info['package_json']
                    readme_md = model_info['readme_md']
                    schemas = model_info['schemas']

                    user_model_info = {
                        'userid': userid,
                        'npm_package': npm_package,
                        'repo_url': repo_url,
                        'status': 'active'
                    }

                    try:
                        cdb = CeramicDB()

                        resp = {
                            'state': 'ADDING_MODEL',
                            'model_id': model_id,
                            'version': package_json['version'],
                            'author': package_json['author'],
                            'keywords': ','.join(package_json['keywords']),
                            'readme_md': readme_md,
                            'package_json': package_json,
                            'schemas': schemas,
                            'user_model_info': user_model_info,
                        }

                        cdb.add_model(
                            model_id,
                            package_json['version'],
                            package_json['author'],
                            ','.join(package_json['keywords']),
                            readme_md,
                            package_json,
                            schemas,
                            user_model_info
                        )

                    except Exception as e:
                        print(e)
                else:
                    success = False
                    status = 400
                    reason = 'error-fetching-files-from-github:' + result['reason']
                    
        except:
            success = False
            status = 400
            reason = 'error-fetching-npm-info'
        

    response = jsonify({'success': success, 'reason': reason, 'data': resp})
    response = add_cors_headers(request, response)

    return response, status

@app.route("/api/applications", methods=['GET', 'POST'])
def api_applications():
    """
    API endpoint for adding and retrieving applications that use created models

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
        cdb = CeramicDB()
        resp = cdb.get_applications()

    elif request.method == 'POST':
        body = request.json
        name = body.get('name', '').strip()
        image_url = body.get('imageURL', '').strip()
        description = body.get('description', '').strip()
        userid = body.get('userid', '').strip()
        app_url = body.get('appURL', '').strip()
        data_model_ids_csv = body.get('dataModelIDs', '').strip()
        data_model_ids = data_model_ids_csv.split(',')
        
        try:
            cdb = CeramicDB()
            resp = {'add app: ': [name, image_url, description, userid, app_url, data_model_ids]}
            cdb.add_application(name, image_url, description, userid, app_url, data_model_ids)
        except Exception as e:
            success = False
            status = 400
            print(e)
            reason = 'error-db-error-adding-application:' + str(e)
        

    response = jsonify({'success': success, 'reason': reason, 'data': resp})
    response = add_cors_headers(request, response)

    return response, status


if __name__ == '__main__':
    app.run(debug=True, host='0.0.0.0', port=8878)
