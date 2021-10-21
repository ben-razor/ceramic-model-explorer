import { useEffect, useState } from 'react';
import Image from 'next/image';
import styles from '../style/App.module.css'

function UserModels(props) {
    let goBack = props.goBack;
    
    return <div className={styles.applicationsPanel}>
        <button onClick={e => goBack()}>&lArr; Back</button>
        <div class={styles.csnSubPage}>
            <div class={styles.csnSubPageHeader}>
                User Models
            </div>
            <div class={styles.csnSubPageContent}>
                Submit links to your own models.
            </div>
        </div>
    </div>
}

export default UserModels;