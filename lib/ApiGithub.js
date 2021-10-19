
class ApiGithub {
    constructor(githubID, repoName) {
        this.githubID = githubID;
        this.repoName = repoName;
    }

    async get(url) {
        let token = process.env.NEXT_PUBLIC_GITHUB_TOKEN;
        let r = await fetch(url, {headers: {
            'Authorization': `token ${token}`
        }});
        let j = await r.json();
        return j;
    }

    async getRepositoryInfo() {
        let j = await this.get(`https://api.github.com/orgs/${this.githubID}/repos`);
        let repoInfo = j.filter(x => x.name === this.repoName)[0];
        return repoInfo;
    }

    async getPullRequests(state) {
        let j = await this.get(`https://api.github.com/repos/${this.githubID}/${this.repoName}/pulls`)

        if(state) {
            j = j.filter(x => x.state === state);
        }

        return j;
    }

    async lsTree(path, branch='main') {
        let j = await this.get(`https://api.github.com/repos/${this.githubID}/${this.repoName}/git/trees/${branch}`);

        let tree = j.tree;

        if(path) {
            tree = tree.filter(x => x.path === path);
        }

        return tree;
    } 

    getRawContentURL(branch, file_path) {
        return `https://raw.githubusercontent.com/${this.githubID}/${this.repoName}/${branch}/${file_path}`;
    }
}

export default ApiGithub;