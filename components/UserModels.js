import { useEffect, useState } from 'react';
import Image from 'next/image';
import styles from '../style/App.module.css'

function UserModels(props) {
    const goBack = props.goBack;
    const host = props.host;
    const ceramic = props.ceramic;
    const toast = props.toast;
    const jws = props.jws;
    const setUserModelAdding = props.setUserModelAdding;
    const userModels = props.userModels;
    
    const [name, setName] = useState('');
    const [npmPackage, setNpmPackage] = useState('');
    const [repoURL, setRepoURL] = useState('');
    const [error, setError] = useState('');

    function submitUserModel(e) {
        if(ceramic) {
            let userID = ceramic.did.id;

            (async() => {
                try {
                    let r = await fetch(host + '/api/user_models', {
                        method: 'POST',
                        headers: {
                            'Accept': 'application/json',
                            'Content-Type': 'application/json'
                        },
                        body: JSON.stringify({
                            userid: userID,
                            modelid: name,
                            npmPackage: npmPackage,
                            repoURL: repoURL,
                            jws: jws
                        })
                    });

                    let j = await r.json();

                    if(j.success) {
                        toast('Great! Your model was added');
                        setUserModelAdding(true);
                    }
                    else {
                        toast('Error adding model: ' + j.reason);
                        console.log('User model error', j.reason);
                    }
                }
                catch(e) {
                    toast('Error submitting model', 'error');
                    console.log(e);
                }
            })();
        }
        else {
            toast('Connect to add models');
        }

        e.preventDefault();
    }

    function displayUserModels(userModels) {
        let apps = [];
        let i = 0;
        for(let [modelid, model] of Object.entries(userModels)) {

            let rows = 
            <form onSubmit={e => editApplication(e)} key={modelid}>
                <div className={styles.userModelResult}>
                    <div className={styles.userModelInfo}>
                        <div className={styles.dataModelResultRow}>
                            <div className={styles.dataModelResultTitle}>
                                Name
                            </div>
                            <div className={styles.dataModelResultValue}>
                                {modelid}
                            </div>
                        </div>
                        <div className={styles.dataModelResultRow}>
                            <div className={styles.dataModelResultTitle}>
                                NPM Package 
                            </div>
                            <div className={styles.dataModelResultValue}>
                                <a href={'https://www.npmjs.com/package/' + model.packageid} target="_blank" rel="noreferrer">
                                    {model.packageid}
                                </a>
                            </div>
                        </div>
                        <div className={styles.dataModelResultRow}>
                            <div className={styles.dataModelResultTitle}>
                                Repository URL 
                            </div>
                            <div className={styles.dataModelResultValue}>
                                <a href={model.repo_url} target="_blank" rel="noreferrer">{model.repo_url}</a>
                            </div>
                        </div>
                    </div>
                </div>
            </form>
            apps.push(rows)
        }
        return apps;
    }

    return <div className={styles.userModelsPanel}>
        <button onClick={e => goBack()}>&lArr; Back</button>
        <div className={styles.csnSubPage}>
            <div className={styles.csnSubPageHeader}>
                User Models
            </div>
            <div className={styles.csnSubPageContent}>
                Submit links to your own models.

                <form onSubmit={e => submitUserModel(e)}>
                    <div className={styles.csnForm}>
                        <div className={styles.csnFormRow}>
                            <div className={styles.csnFormLabel}>
                                Name:
                            </div>
                            <div className={styles.csnFormEntry}>
                                <input type="text" value={name} onChange={e => setName(e.target.value)} placeholder="E.g. crispy-bacon" required pattern=".+[-].+" />
                            </div>
                        </div>

                        <div className={styles.csnFormRow}>
                            <div className={styles.csnFormLabel}>
                                NPM Package:
                            </div>
                            <div className={styles.csnFormEntry}>
                                <input type="text" value={npmPackage} onChange={e => setNpmPackage(e.target.value)} placeholder="E.g. @laurent-garnier/crispy-bacon" required pattern="^@.+/.+" />
                            </div>
                        </div>

                        <div className={styles.csnFormRow}>
                            <div className={styles.csnFormLabel}>
                                Repo URL:
                            </div>
                            <div className={styles.csnFormEntry}>
                                <input type="url" value={repoURL} onChange={e => setRepoURL(e.target.value)} placeholder="https://github.com/laurent-garnier/datamodels/tree/your-branch/packages/crispy-bacon" required />
                            </div>
                        </div>

                        <div className={styles.csnFormRow}>
                            <input type="submit" name="submit" value="Submit" />
                        </div>
                    </div>
                </form>
                <div>
                    <h5>All User Models</h5>
                    { displayUserModels(userModels) }
                </div>
            </div>
        </div>
    </div>
}

export default UserModels;