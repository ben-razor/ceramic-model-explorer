import requests
import urllib.parse

def encodeURIComponent(part):
    return urllib.parse.quote(part, safe='')

class ApiNPM:
    def __init__(self):
        self.host = 'https://registry.npmjs.cf'
        self.apiHost = 'https://api.npmjs.org'
        self.npmsHost = 'https://api.npms.io/v2';

    def getRepoInfo(self, package):
        package = encodeURIComponent(package);
        r = requests.get(self.host + '/' + package)
        j = r.json()
        return j


    def getRegistryScore(self, package):
        """ Gets npm registry api score in format:
        
        score: {
            detail: {
                maintenance: 0.33324616339425556
                popularity: 0.0050101899852684996
                quality: 0.40060513735475
            }
            final: 0.23857126488925962
        }
        
        API is here:
        
        https://github.com/npm/registry/blob/master/docs/REGISTRY-API.md
        
        param: {string} package 
        """
        packageEnc = encodeURIComponent(package)
        url = f'{self.host}/-/v1/search?text={packageEnc}&size=10'
        r = requests.get(url)
        j = r.json()

        details = {}
        print('j', j)
        if j and 'objects' in j:
            objs = j['objects']
            print('objs', objs)
            for object in objs:
                print('in obj', object['package']['name'])
                if object['package']['name'] == package:
                    details = object['score']
                    break

        return details

        """
        Get's download stats in format:
        {"downloads":15,"start":"2021-09-20","end":"2021-10-19","package":"@datamodels/3id-keychain"}
        
        @param {string} package 
        @param {string} period (last-day|last-week|last-month)
        """
    def getDownloads(self, package, period='last-month'):
        package = encodeURIComponent(package)
        url = self.apiHost + f'/downloads/point/{period}/{package}'
        r = requests.get(url)
        j = r.json()
        return j
