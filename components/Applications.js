import { useEffect, useState } from 'react';
import Image from 'next/image';
import styles from '../style/App.module.css'

function Applications(props) {
    const goBack = props.goBack;
    const host = props.host;
    const ceramic = props.ceramic;
    const toast = props.toast;

    const [name, setName] = useState('');
    const [description, setDescription] = useState('');
    const [imageURL, setImageURL] = useState('');
    const [appURL, setAppURL] = useState('');
    const [dataModelIDs, setDataModelIDs] = useState('');
    const [error, setError] = useState('');


    function submitApplication(e) {
        if(ceramic) {
            let userID = ceramic.did.id;

            (async() => {
                try {
                    let r = await fetch(host + '/api/applications', {
                        method: 'POST',
                        headers: {
                            'Accept': 'application/json',
                            'Content-Type': 'application/json'
                        },
                        body: JSON.stringify({
                            name: name,
                            imageURL: imageURL,
                            description: description,
                            userid: userID,
                            appURL: appURL,
                            dataModelIDs: dataModelIDs
                        })
                    });

                    let j = await r.json();

                    if(j.success) {
                        toast('Great! Your application was added')
                    }
                    else {
                        toast('Error adding application: ' + j.error);
                        console.log('Add application error', j.error);
                    }
                }
                catch(e) {
                    toast('Error submitting application', 'error');
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
                Applications
            </div>
            <div class={styles.csnSubPageContent}>
                Submit links to applications that use Ceramic DataModels.


                <form onSubmit={e => submitApplication(e)}>
                    <div className={styles.csnForm}>
                        <div className={styles.csnFormRow}>
                            <div className={styles.csnFormLabel}>
                                Name:
                            </div>
                            <div className={styles.csnFormEntry}>
                                <input type="text" value={name} onChange={e => setName(e.target.value)} placeholder="Application name" required />
                            </div>
                        </div>

                        <div className={styles.csnFormRow}>
                            <div className={styles.csnFormLabel}>
                                Description:
                            </div>
                            <div className={styles.csnFormEntry}>
                                <input type="text" value={description} onChange={e => setDescription(e.target.value)} placeholder="Application description" required />
                            </div>
                        </div>

                        <div className={styles.csnFormRow}>
                            <div className={styles.csnFormLabel}>
                                Image URL:
                            </div>
                            <div className={styles.csnFormEntry}>
                                <input type="url" value={imageURL} onChange={e => setImageURL(e.target.value)} placeholder="Image URL"/>
                            </div>
                        </div>

                        <div className={styles.csnFormRow}>
                            <div className={styles.csnFormLabel}>
                                Application URL:
                            </div>
                            <div className={styles.csnFormEntry}>
                                <input type="url" value={appURL} onChange={e => setAppURL(e.target.value)} placeholder="Application URL" />
                            </div>
                        </div>

                        <div className={styles.csnFormRow}>
                            <div className={styles.csnFormLabel}>
                                DataModel Packages (csv):
                            </div>
                            <div className={styles.csnFormEntry}>
                                <input type="text" value={dataModelIDs} onChange={e => setDataModelIDs(e.target.value)} placeholder="E.g. 3id-keychain,basic-skills" required />
                            </div>
                        </div>

                        <div className={styles.csnFormRow}>
                            <input type="submit" name="submit" value="Submit" />
                        </div>
                    </div>
                </form>

            </div>
        </div>
    </div>
}

export default Applications;