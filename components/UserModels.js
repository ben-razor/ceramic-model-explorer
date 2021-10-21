import { useEffect, useState } from 'react';
import Image from 'next/image';
import styles from '../style/App.module.css'

function UserModels(props) {
    let goBack = props.goBack;
    
    const [name, setName] = useState('');
    const [npmPackage, setNpmPackage] = useState('');
    const [repoURL, setRepoURL] = useState('');

    function submitUserModel(e) {
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
                                <input type="text" value={name} onChange={e => setName(e.target.value)} placeholder="E.g. crispy-bacon" />
                            </div>
                        </div>

                        <div class={styles.csnFormRow}>
                            <div class={styles.csnFormLabel}>
                                NPM Package:
                            </div>
                            <div class={styles.csnFormEntry}>
                                <input type="text" value={npmPackage} onChange={e => setNpmPackage(e.target.value)} placeholder="E.g. @laurent-garnier/crispy-bacon" />
                            </div>
                        </div>

                        <div class={styles.csnFormRow}>
                            <div class={styles.csnFormLabel}>
                                Repo URL:
                            </div>
                            <div class={styles.csnFormEntry}>
                                <input type="url" value={repoURL} onChange={e => setRepoURL(e.target.value)} placeholder="https://github.com/laurent-garnier/datamodels/tree/your-branch/packages/crispy-bacon" />
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