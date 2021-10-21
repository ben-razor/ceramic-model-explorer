import { useEffect, useState } from 'react';
import Image from 'next/image';
import styles from '../style/App.module.css'

function UserModels(props) {
    const goBack = props.goBack;
    const host = props.host;
    const ceramic = props.ceramic;
    const toast = props.toast;
    
    const [name, setName] = useState('');
    const [npmPackage, setNpmPackage] = useState('');
    const [repoURL, setRepoURL] = useState('');
    const [error, setError] = useState('');

    useEffect(() => {
        if(error) {
            toast(error);
        }
    }, [error])

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
                            name: modelid,
                            npmPackage: npmPackage,
                            repoURL: repoURL
                        })
                    });

                    let j = await r.json();

                    if(j.success) {

                    }
                    else {
                        setError(j.error);
                        console.log('User model error', j.error);
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

    return <div className={styles.applicationsPanel}>
        <button onClick={e => goBack()}>&lArr; Back</button>
        <div class={styles.csnSubPage}>
            <div class={styles.csnSubPageHeader}>
                User Models
            </div>
            <div class={styles.csnSubPageContent}>
                Submit links to your own models.

                <form onSubmit={e => submitUserModel(e)}>
                    <div class={styles.csnForm}>
                        <div class={styles.csnFormRow}>
                            <div class={styles.csnFormLabel}>
                                Name:
                            </div>
                            <div class={styles.csnFormEntry}>
                                <input type="text" value={name} onChange={e => setName(e.target.value)} placeholder="E.g. crispy-bacon" required pattern=".+[-].+" />
                            </div>
                        </div>

                        <div class={styles.csnFormRow}>
                            <div class={styles.csnFormLabel}>
                                NPM Package:
                            </div>
                            <div class={styles.csnFormEntry}>
                                <input type="text" value={npmPackage} onChange={e => setNpmPackage(e.target.value)} placeholder="E.g. @laurent-garnier/crispy-bacon" required pattern="^@.+/.+" />
                            </div>
                        </div>

                        <div class={styles.csnFormRow}>
                            <div class={styles.csnFormLabel}>
                                Repo URL:
                            </div>
                            <div class={styles.csnFormEntry}>
                                <input type="url" value={repoURL} onChange={e => setRepoURL(e.target.value)} placeholder="https://github.com/laurent-garnier/datamodels/tree/your-branch/packages/crispy-bacon" required />
                            </div>
                        </div>

                        <div class={styles.csnFormRow}>
                            <input type="submit" name="submit" value="Submit" />
                        </div>
                    </div>
                </form>
            </div>
        </div>
    </div>
}

export default UserModels;