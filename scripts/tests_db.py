import os, sys, unittest, json
import ceramic_db
from datetime import *

cur_dir = os.path.dirname(sys.argv[0])

class TestCeramicDB(unittest.TestCase):

    def setUp(self):
        self.cdb = ceramic_db.CeramicDB('testdb.db')

    def tearDown(self):
        os.remove('testdb.db')

    def test_init(self):
        self.assertTrue(self.cdb)

    def test_get_user_ratings(self):
        ratings = self.cdb.get_user_ratings('br')
        self.assertListEqual(ratings, [])

        self.cdb.rate('br', 'skill', 1, 'Great model')

        ratings = self.cdb.get_user_ratings('br')
        print(ratings)
        self.assertListEqual(ratings, [('br', 'skill', 1, 'Great model')])

    def test_get_models(self):
        models = self.cdb.search_models('skill')
        self.assertListEqual(models, [])

        self.cdb.add_model('skill', 'Skill', '0.0.1', 'br', 'skill,talent', '{"schema": "my amazing schema"}', 'Readme info')

        models = self.cdb.search_models('skill')
        self.assertListEqual(models, [('skill', 'Skill', '0.0.1', 'br', 'skill,talent', '{"schema": "my amazing schema"}', 'Readme info')])

if __name__ == '__main__':
	unittest.main()