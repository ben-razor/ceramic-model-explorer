import os, sys, unittest, json
import ceramic_db
from datetime import *

cur_dir = os.path.dirname(sys.argv[0])

class TestCeramicDB(unittest.TestCase):

    def test_init(self):
        cdb = ceramic_db.CeramicDB()
        self.assertTrue(cdb)

    def test_get_user_ratings(self):
        cdb = ceramic_db.CeramicDB()
        ratings = cdb.get_user_ratings('br')
        self.assertListEqual(ratings, [])

if __name__ == '__main__':
	unittest.main()