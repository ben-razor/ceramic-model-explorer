import { useEffect, useState } from 'react';
import Image from 'next/image';
import styles from '../style/App.module.css'
import ReactMarkdown from 'react-markdown'

function DataModel(props) {
    let selectedModel = props.selectedModel;
    let setSelectedModel = props.setSelectedModel;
    let displayBasicModelInfo = props.displayBasicModelInfo;
    let goBack = props.goBack;
    let host = props.host;
    let modelStats = props.modelStats;
    let userModels = props.userModels;
    let applicationCount = props.applicationCount;

    const [selectedTab, setSelectedTab] = useState('readme');
    const [modelInfo, setModelInfo] = useState({});
    const [name, setName] = useState('');
   
    useEffect(() => {
        if(selectedModel) {
            (async() => {
                let r = await fetch(host + '/api/get_model?' + new URLSearchParams({
                    'modelid': selectedModel
                }))

                let j = await r.json();
                // TODO: Only get one schema at the moment
                setModelInfo(j.data[0]);
            })()
            
            let _name = selectedModel.split('-').map(x => x[0].toUpperCase() + x.slice(1)).join(' ');
            setName(_name);

        }
    }, [selectedModel]);

    function prettyPrintSchema(schema) {
        let content = 'Schema not loaded';
        try {
            content = JSON.stringify(JSON.parse(schema), null, 2)
        }
        catch(e) {
            console.log(e);
        }
        return content;
    }

    let id = selectedModel;
    let monthly_downloads = 0;
    let npm_score = 0;
    if(modelStats[id]) {
      monthly_downloads = modelStats[id].monthly_downloads || 0;
      npm_score = modelStats[id].npm_score || 0;
    }

    let userModelInfo = {};
    if(userModels && userModels[id]) {
        userModelInfo = userModels[id];
    }

    let numApplicationsDisp = 0;
    if(applicationCount && applicationCount[id]) {
      numApplicationsDisp = applicationCount[id];
    }

    return <div className={styles.dataModelPanel}>
        <button onClick={e => goBack()}>&lArr; Back</button>
        <div className={styles.dataModelResult}>
            <div className={styles.dataModelResultHeader}>
            <div className={styles.dataModelHeaderName}>{name}</div>
            </div>
            <div className={styles.dataModelSelectedContent}>

                <div className={styles.csnTabs}>
                    <div onClick={e => setSelectedTab('readme')} className={styles.csnTab + ' ' + (selectedTab === 'readme' && styles.csnTabActive)}>README</div>
                    <div onClick={e => setSelectedTab('')} className={styles.csnTab + ' ' + (!selectedTab && styles.csnTabActive)}>Model</div>
                    <div onClick={e => setSelectedTab('schema')} className={styles.csnTab + ' ' + (selectedTab === 'schema' && styles.csnTabActive)}>Schema</div>
                    <div onClick={e => setSelectedTab('package')} className={styles.csnTab + ' ' + (selectedTab === 'package' && styles.csnTabActive)}>package.json</div>
                </div>
                <div className={styles.csnTabContent}>
                    <div className={styles.csnTabModelInfo} style={{display: !selectedTab ? 'block' : 'none'}}>
                        {displayBasicModelInfo(selectedModel, modelInfo.version, modelInfo.author, 
                                               modelInfo.keywords, monthly_downloads, npm_score, userModelInfo,
                                               numApplicationsDisp)}
                        <div className={styles.csnSuggestionsPanel}>
                            <div className={styles.csnSuggestionsTitle}>
                                Model Improvements 
                            </div>
                            <div className={styles.csnSuggestionsContent}>
                                <p>Think that this model could be improved?</p>
                                <p>Join the discussion at&nbsp;
                                    <a href="https://github.com/ceramicstudio/datamodels/discussions/categories/models" target="_blank" rel="noreferrer">
                                        DataModel Discussions
                                    </a> 
                                    .
                                </p>
                            </div>
                        </div>
                    </div>
                    <div className={styles.csnTabSchema} style={{display: selectedTab === 'schema' ? 'block' : 'none'}}>
                        <div className={styles.csnSchemaViewer}>
                            { modelInfo.schema_json && prettyPrintSchema(modelInfo.schema_json)}
                        </div>
                    </div>
                    <div className={styles.csnTabSchema} style={{display: selectedTab === 'readme' ? 'block' : 'none'}}>
                        <div className={styles.csnMarkdownViewer}>
                            { modelInfo.readme && 
                                <ReactMarkdown>
                                    { modelInfo.readme }
                                </ReactMarkdown>
                            }
                        </div>
                    </div>
                    <div className={styles.csnTabSchema} style={{display: selectedTab === 'package' ? 'block' : 'none'}}>
                        <div className={styles.csnSchemaViewer}>
                            { modelInfo.package_json && prettyPrintSchema(modelInfo.package_json)}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>
}

export default DataModel;