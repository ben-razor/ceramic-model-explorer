import requests

class ApiGithub:
    def __init__(self, githubID, repoName):
        self.githubID = githubID;
        self.repoName = repoName;

    def get(self, url):
        NEXT_PUBLIC_GITHUB_TOKEN='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'
        token = NEXT_PUBLIC_GITHUB_TOKEN;

        r = requests.get(url, headers = { 'Authorization': f'token {token}' });
        j = r.json()
        return j;

    def getRepositoryInfo(self):
        j = self.get(f'https://api.github.com/orgs/{self.githubID}/repos');
        repoInfo = list(filter(lambda x: x['name'] == self.repoName, j))[0]
        return repoInfo

    def getPullRequests(self, state):
        j = self.get(f'https://api.github.com/repos/{self.githubID}/{self.repoName}/pulls')

        if state:
            j = list(filter(lambda x: x['state'] == state, j))

        return j

    def lsTree(self, path, branch='main'):
        j = self.get('https://api.github.com/repos/{self.githubID}/{self.repoName}/git/trees/{branch}?recursive=1')

        tree = j.tree

        if path:
            tree = list(filter(lambda x: x['path'] == path, tree))

        return tree

    def getRawContentURL(self, branch, file_path):
        return f'https://raw.githubusercontent.com/{self.githubID}/{self.repoName}/{branch}/{file_path}'