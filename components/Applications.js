import { useEffect, useState } from 'react';
import Image from 'next/image';
import styles from '../style/App.module.css'

function Applications(props) {
    let goBack = props.goBack;

    return <div className={styles.applicationsPanel}>
        <button onClick={e => goBack()}>&lArr; Back</button>
        <div class={styles.csnSubPage}>
            <div class={styles.csnSubPageHeader}>
                Applications
            </div>
            <div class={styles.csnSubPageContent}>
                Submit links to applications that use Ceramic DataModels.
            </div>
        </div>
    </div>
}

export default Applications;