import sqlite3
import json
import os

create_ratings_sql = """
    CREATE TABLE IF NOT EXISTS ratings (
        ratings_id integer PRIMARY KEY AUTOINCREMENT,
        userid text NOT NULL, 
        modelid text, 
        rating int,
        comment text,
        UNIQUE (userid, modelid)
    )
"""

create_models_sql = """
    CREATE TABLE IF NOT EXISTS models (
        modelid text NOT NULL PRIMARY KEY,
        version text,
        author text,
        keywords text,
        readme text,
        package_json text
    )
"""

create_schemas_sql = """
    CREATE TABLE IF NOT EXISTS schemas (
        schema_path text NOT NULL PRIMARY KEY,
        modelid text NOT NULL,
        schema_name text,
        schema_json text
    )
"""

create_stats_sql = """
    CREATE TABLE IF NOT EXISTS stats (
        modelid text NOT NULL PRIMARY KEY,
        monthly_downloads int,
        npm_score real,
        npm_quality real,
        num_streams int,
        last_updated text
    )
"""

create_user_models_sql = """
    CREATE TABLE IF NOT EXISTS user_models (
        modelid text NOT NULL PRIMARY KEY,
        userid text NOT NULL,
        npm_package text NOT NULL,
        repo_url text NOT NULL,
        status text NOT NULL,
        last_updated text
    )
"""

create_applications_sql = """
    CREATE TABLE IF NOT EXISTS applications (
        application_id integer PRIMARY KEY AUTOINCREMENT,
        name text NOT NULL,
        image_url text,
        description text NOT NULL,
        userid text NOT NULL,
        app_url text,
        last_updated text
    )
"""

create_application_models_sql = """
    CREATE TABLE IF NOT EXISTS application_models (
        application_models_id integer PRIMARY KEY AUTOINCREMENT,
        application_id integer,
        modelid text
    )
"""

recreate_ratings_sql = """
    DROP TABLE IF EXISTS ratings
"""

recreate_applications_sql = """
    DROP TABLE IF EXISTS applications;
"""

recreate_application_models_sql = """
    DROP TABLE IF EXISTS application_models;
"""

class CeramicDB:
    def __init__(self, db_name='ceramic_models.db'):
        self.con = sqlite3.connect(db_name)

        c = self.con.cursor()
        c.execute(create_ratings_sql)
        c.execute(create_models_sql)
        c.execute(create_schemas_sql)
        c.execute(create_stats_sql)
        c.execute(create_user_models_sql)
        #c.execute(recreate_applications_sql)
        #c.execute(recreate_application_models_sql)
        c.execute(create_applications_sql)
        c.execute(create_application_models_sql)
        self.con.commit()
    
    def __del__(self):
        self.con.close()

    def rate(self, userid, modelid, rating, comment):
        c = self.con.cursor()

        c.execute("""
            INSERT OR REPLACE INTO ratings(userid, modelid, rating, comment)
            VALUES (?, ?, ?, ?)""",
            (userid, modelid, rating, comment)
        )
        self.con.commit()

    def get_user_ratings(self, userid):
        c = self.con.cursor()
        c.execute("SELECT userid, modelid, rating, comment FROM ratings WHERE userid = ?", (userid,))
        rows = c.fetchall()
        return rows

    def get_ratings(self):
        c = self.con.cursor()
        c.execute("""
            SELECT modelid, SUM(rating) AS total 
            FROM ratings
            GROUP BY modelid
        """)
        rows = c.fetchall()
        return rows

    def add_model(self, modelid, version, author, keywords, readme, package_json, schemas, user_model_info=None):
        c = self.con.cursor()

        sql = """
            INSERT INTO models(modelid, version, author, keywords, readme, package_json) 
            VALUES (?, ?, ?, ?, ?, ?)
        """

        values = (modelid, version, author, keywords, readme, json.dumps(package_json))
        print(values)
        c.execute(sql, values)

        sql = """
            INSERT INTO schemas(schema_path, modelid, schema_name, schema_json)
            VALUES (?, ?, ?, ?)
        """

        schema_tuples = [];
        for schema in schemas:
            schema_tuples.append(
                (schema['path'], modelid, schema['name'], json.dumps(schema['schema_json']))
            )

        c.executemany(sql, schema_tuples)

        if user_model_info:
            sql = """
                INSERT INTO user_models(modelid, userid, npm_package, repo_url, status, last_updated)
                VALUES (?, ?, ?, ?, ?, datetime('now'))
            """

            values = (modelid, user_model_info['userid'], user_model_info['npm_package'], 
                      user_model_info['repo_url'], user_model_info['status'])
            
            c.execute(sql, values)

        self.con.commit()

    def get_models(self):
        c = self.con.cursor()
        c.execute("SELECT * FROM models")
        rows = c.fetchall()
        return rows

    def search_models(self, search):
        c = self.con.cursor()

        c.execute("""
            SELECT models.modelid, version, author, keywords, readme, monthly_downloads, npm_score, package_json
            FROM models, schemas, stats
            WHERE (models.modelid = schemas.modelid AND models.modelid = stats.modelid and stats.modelid = schemas.modelid)
            AND models.modelid LIKE ? OR schemas.schema_json LIKE ? OR keywords LIKE ? OR author LIKE ? or readme LIKE ?
            GROUP BY models.modelid
        """, (f'%{search}%', f'%{search}%', f'%{search}%', f'%{search}%', f'%{search}%'))

        rows = c.fetchall()

        return rows
    
    def get_model(self, modelid):
        c = self.con.cursor()

        c.execute("""
            SELECT models.modelid, version, author, keywords, readme, package_json, schema_path, schema_name, schema_json
            FROM models, schemas
            WHERE models.modelid = schemas.modelid
            AND models.modelid = ?
        """, (modelid,))

        rows = c.fetchall()

        return rows

    def get_stats(self, modelid):
            c = self.con.cursor()
            c.execute("""
                SELECT modelid, monthly_downloads, npm_score, npm_quality, num_streams
                FROM stats 
                WHERE modelid = ?
            """, (modelid,)
            )
            row = c.fetchone()
            return row

    def get_all_stats(self):
            c = self.con.cursor()
            c.execute("""
                SELECT modelid, monthly_downloads, npm_score, npm_quality, num_streams
                FROM stats 
            """)
            row = c.fetchall()
            return row

    def add_stats(self, modelid, monthly_downloads, npm_score, npm_quality, num_streams):
        c = self.con.cursor()

        c.execute("""
            INSERT OR REPLACE INTO stats(modelid, monthly_downloads, npm_score, npm_quality, num_streams, last_updated)
            VALUES (?, ?, ?, ?, ?, datetime('now'))""",
            (modelid, monthly_downloads, npm_score, npm_quality, num_streams)
        )
        self.con.commit()

    def get_user_models(self, userid):
        c = self.con.cursor()
        if userid:
            c.execute("""
                SELECT modelid, userid, npm_package, repo_url, status, last_updated
                FROM user_models WHERE userid = ?
            """, (userid,))
        else:
            c.execute("""
                SELECT modelid, userid, npm_package, repo_url, status, last_updated
                FROM user_models
            """)

        rows = c.fetchall()
        return rows

    def get_applications(self):
        c = self.con.cursor()
        c.execute("""
            SELECT applications.application_id, name, image_url, description, userid, app_url, last_updated, modelid
            FROM applications, application_models
            WHERE applications.application_id = application_models.application_id
        """)
        rows = c.fetchall()

        # Convert modelids from rows into array with single application record
        model_list_rows = {}
        for row in rows:
            _row = list(row)
            app_id = _row[0]
            model_id = _row[7]

            if app_id in model_list_rows:
                model_list_rows[app_id][7].append(model_id)
            else:
                model_list_rows[app_id] = _row
                model_list_rows[app_id][7] = [model_id]
        
        rows = list(model_list_rows.values())

        return rows

    def add_application(self, name, image_url, description, userid, app_url, data_model_ids):

        c = self.con.cursor()
       
        sql = """
            INSERT INTO applications(name, image_url, description, userid, app_url, last_updated) 
            VALUES (?, ?, ?, ?, ?, datetime('now'))
        """

        values = (name, image_url, description, userid, app_url)
        c.execute(sql, values)

        application_id = c.lastrowid
        sql = """
            INSERT INTO application_models(application_id, modelid)
            VALUES (?, ?)
        """

        tuples = [];
        for model_id in data_model_ids:
            tuples.append( (application_id, model_id ) )

        c.executemany(sql, tuples)

        self.con.commit()