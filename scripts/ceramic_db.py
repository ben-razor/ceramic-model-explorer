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
        package_json text,
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
        description text NOT NULL,
        userid text NOT NULL,
        image text,
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

class CeramicDB:
    def __init__(self, db_name='ceramic_models.db'):
        self.con = sqlite3.connect(db_name)

        c = self.con.cursor()
        c.execute(create_ratings_sql)
        c.execute(create_models_sql)
        c.execute(create_schemas_sql)
        c.execute(create_stats_sql)
        c.execute(create_user_models_sql)
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

    def add_model(self, modelid, version, author, keywords, readme, package_json, schemas):
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

        self.con.commit()

    def get_models(self):
        c = self.con.cursor()
        c.execute("SELECT * FROM models")
        rows = c.fetchall()
        return rows

    def search_models(self, search):
        c = self.con.cursor()

        c.execute("""
            SELECT models.modelid, version, author, keywords, readme, monthly_downloads, npm_score
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
        c.execute("""
            SELECT modelid, userid, npm_package, repo_url, status, last_updated
            FROM user_models WHERE userid = ?
        """, (userid,))
        rows = c.fetchall()
        return rows

    def get_applications(self):
        c = self.con.cursor()
        c.execute("""
            SELECT application_id, name, description, userid, image, last_updated
            FROM applications, application_models
            WHERE application.application_id = application_models.application_id
        """)
        rows = c.fetchall()
        return rows
