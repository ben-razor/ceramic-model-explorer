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
            SELECT DISTINCT models.modelid, version, author, keywords, readme FROM models, schemas
            WHERE models.modelid = schemas.modelid
            AND models.modelid LIKE ? OR schemas.schema_json LIKE ? OR keywords LIKE ? OR author LIKE ? or readme LIKE ?
        """, (f'%{search}%', f'%{search}%', f'%{search}%', f'%{search}%', f'%{search}%'))

        rows = c.fetchall()

        return rows
    
    def get_model(self, modelid):
        c = self.con.cursor()

        c.execute("""
            SELECT models.modelid, version, author, keywords, readme, package_json, schema_path, schema_name, schema_json
            FROM models, schemas
            WHERE models.modelid = schemas.modelid
        """)

        rows = c.fetchall()

        return rows
