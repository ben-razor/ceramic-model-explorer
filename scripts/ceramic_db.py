import sqlite3

create_ratings_sql = """
    CREATE TABLE IF NOT EXISTS ratings (
        userid text NOT NULL PRIMARY KEY, 
        modelid text, 
        rating int,
        comment text,
        UNIQUE (userid, modelid)
    )
"""

create_models_sql = """
    CREATE TABLE IF NOT EXISTS models (
        modelid text NOT NULL PRIMARY KEY,
        name text,
        version text,
        author text,
        keywords text,
        schemas text
    )
"""

class CeramicDB:
    def __init__(self):
        self.con = sqlite3.connect('ceramic_models.db')

        c = self.con.cursor()
        c.execute(create_ratings_sql)
        c.execute(create_models_sql)
        self.con.commit()
    
    def __del__(self):
        self.con.close()

    def rate(self, userid, modelid, rating, comment):
        c = self.con.cursor()

        c.execute("""
            INSERT INTO ratings(userid, model, rating, comment)
            VALUES (?, ?, ?, ?)""",
            (userid, modelid, rating, comment)
        )
        self.con.commit()

    def get_user_ratings(self, userid):
        c = self.con.cursor()
        c.execute("SELECT * FROM ratings WHERE userid = ?", (userid,))
        rows = c.fetchall()
        return rows

    def add_model(self, modelid, name, version, author, keywords, schemas):
        c = self.con.cursor()

        sql = """
            INSERT INTO models(modelid, name, version, author, keywords, schemas) 
            VALUES (?, ?, ?, ?, ?, ?)
        """

        c.execute(sql, (modelid, name, version, author, keywords, schemas))

        self.con.commit()

    def search_models(self, search):
        c = self.con.cursor()

        c.execute("""
            SELECT * FROM models 
            WHERE name LIKE ? OR schemas LIKE ? OR keywords LIKE ? OR author LIKE ?
        """, (f'%{search}%', f'%{search}%', f'%{search}%', f'%{search}%'))

        rows = c.fetchAll()

        return rows
