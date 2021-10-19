#!/usr/bin/env python3
import os, uuid
from flask import Flask
from flask import Flask, request, url_for, render_template, jsonify
from flask_cors import CORS
from ceramic_db import CeramicDB
import json

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
            resp = json.dumps(ratings)
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
                rating = int(rating)
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
    print('origin', origin)
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

    body = request.json

    aqua = body.get('aqua', '').strip()
    lang = body.get('lang', '').strip()

    session_id = uuid.uuid4().hex

    file_name = session_id + '.aqua'
    script_name = file_name
    script_name_base = script_name.split('.')[0]
    input_dir = './aqua_scripts'
    input_file = f'{input_dir}/{file_name}'

    with open(input_file, 'w') as f:
        f.write(aqua)

    return_code, result_string = compile_aqua(file_name, lang)

    if os.path.exists(input_file):
        os.remove(input_file)

    resp = {
        'output': result_string
    }

    if return_code == 0:
        pass
    else:
        success = False
        reason = 'compilation-failed'

    response = jsonify({'success': success, 'reason': reason, 'data': resp})

    origin = request.headers.get('Origin')
    origin_no_port = ':'.join(origin.split(':')[:2])
    allow_origin_list = ['https://aqua-explore.web.app', 'https://34.77.88.57']

    if 'localhost' in request.base_url:
        allow_origin_list = ['http://localhost']

    if origin_no_port in allow_origin_list:
        response.headers.add('Access-Control-Allow-Origin', origin)

    return response, status

if __name__ == '__main__':
    app.run(debug=True, host='0.0.0.0', port=8878)
