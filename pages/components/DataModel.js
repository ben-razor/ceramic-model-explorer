import { useEffect, useState } from 'react';
import Image from 'next/image';
import styles from '../../style/App.module.css'

function DataModel(props) {
    let selectedModel = props.selectedModel;
    let setSelectedModel = props.setSelectedModel;

    const [selectedTab, setSelectedTab] = useState('');

    function goBack() {
        setSelectedModel('');
    }

    return <div className={styles.dataModelPanel}>
        <button onClick={e => goBack()}>&lArr; Back</button>

        <div className={styles.csnTabs}>
            <div onClick={e => setSelectedTab('')} className={styles.csnTab + ' ' + (!selectedTab && styles.csnTabActive)}>Model</div>
            <div onClick={e => setSelectedTab('schema')} className={styles.csnTab + ' ' + (selectedTab === 'schema' && styles.csnTabActive)}>Schema</div>
        </div>
        <div class={styles.csnTabContent}>
            <div class={styles.csnTabModelInfo} style={{display: !selectedTab ? 'block' : 'none'}}>
                Model info
            </div>
            <div class={styles.csnTabSchema} style={{display: selectedTab === 'schema' ? 'block' : 'none'}}>
                Schema 
            </div>
        </div>
    </div>
}

export default DataModel;