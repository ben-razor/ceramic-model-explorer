
class ApiNPM {

    constructor() {
        this.host = 'https://registry.npmjs.cf';
        this.apiHost = 'https://api.npmjs.org';
        this.npmsHost = 'https://api.npms.io/v2';
    }

    async getRepoInfo(package) {
        package = encodeURIComponent(package);
        let r = await fetch(this.host + '/' + package)
        let j = await r.json();
        return j;
    }

    /**
     * 
     * Gets npm registry api score in format:
     * 
     * score: {
        detail: {
            maintenance: 0.33324616339425556
            popularity: 0.0050101899852684996
            quality: 0.40060513735475
        }
        final: 0.23857126488925962
    }
     * 
     * API is here:
     * 
     * https://github.com/npm/registry/blob/master/docs/REGISTRY-API.md
     * 
     * @param {string} package 
     */
    async getRegistryScore(package) {
        package = encodeURIComponent(package);
        let url = `{this.host}/-/v1/search?text=${package}&size=10`
        let r = await fetch(url);
        let j = await r.json();

        let details = {};
        if(j && j.objects) {
            for(let object in j.objects) {
                if(object.package.name === package) {
                    details = object.score;
                    break;
                }
            }
        }

        return details;
    }

    /**
     * Get's download stats in format:
     * 
     * {"downloads":15,"start":"2021-09-20","end":"2021-10-19","package":"@datamodels/3id-keychain"}
     * 
     * @param {string} package 
     * @param {string} period (last-day|last-week|last-month)
     */
    async getDownloads(package, period) {
        package = encodeURIComponent(package);
        let r = await fetch(this.apiHost + `/downloads/point/${period}/${package}`);
    }

    /**
     * Get the npms score for the package in format:
     * 
     * {
     *   analyzedAt: "2021-08-19T14:17:20.433Z"
     *   collected: {metadata: {…}, npm: {…}}
     *   evaluation: {quality: {…}, popularity: {…}, maintenance: {…}}
     *   score: {final: 0.03145670420721216, detail: {
     *      maintenance: 0
     *      popularity: 0
     *      quality: 0.1048556806907072
     *   }}
     * 
     * @param {string} package 
     */
    async getScore(package) {
        package = encodeURIComponent(package);
        let r = await fetch(this.npmsHost + '/package/' + package);
        let j = r.json();
        return j;
    }

    /**
     * Get score multi
     * 
     * https://api.npms.io/v2/package/mget
Example usage
curl -X POST "https://api.npms.io/v2/package/mget" \
	    -H "Accept: application/json" \
	    -H "Content-Type: application/json" \
	    -d '["cross-spawn", "react"]'
     */
}

export default ApiNPM;