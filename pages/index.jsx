import Head from 'next/head'
import { useEffect, useState } from 'react'
import { Container, Row, Card, Button } from 'react-bootstrap'
import { Image } from 'react-bootstrap'
import ApiGithub from '../lib/ApiGithub'
import { isLocal } from '../lib/helpersHTML'
import styles from '../style/App.module.css'
import { ToastProvider, useToasts } from 'react-toast-notifications';

export default function Home() {

  const [host, setHost] = useState('');
  const [search, setSearch] = useState('');
  const [dataModels, setDataModels] = useState([]);
  const [matchingDataModels, setMatchingDataModels] = useState([]);
  const [ownRatings, setOwnRatings] = useState({});
  const [userID, setUserID] = useState('');
  const { addToast } = useToasts();

  useEffect(() => {
    let _host = 'https://benrazor.net:8878';
    if(isLocal()) {
        _host = `http://localhost:8878`;
    }

    setHost(_host);
  }, [])

  useEffect(() => {
    if(host) {
      (async() => {

        let r = await fetch(host + '/api/search_models?' + new URLSearchParams({
          'search': ''
        }))

        let j = await r.json();

        setDataModels(j.data);
        setMatchingDataModels(j.data);
      })();
    }
 }, [host]);

  useEffect(() => {
    if(userID && dataModels) {
      (async() => {
        let r = await fetch(host + '/api/rate?' + new URLSearchParams({
          'userid': userID 
        }))

        let j = await r.json();

      })();
    }
  }, [userID, dataModels]);

  useEffect(() => {
    if(dataModels) {
      let _dataModels = [...dataModels];
      let _matchingDataModels = _dataModels.filter(model => {
        let id = model[0];
        let name = model[0].split('-').map(x => x[0].toUpperCase() + x.slice(1)).join(' ');
        let version = model[1];
        let author = model[2];
        let tags = model[3];
        let readme = model[4];

        return id.includes(search) || name.includes(search) || tags.includes(search) || readme.includes(search);
      })
      setMatchingDataModels(_matchingDataModels);
    }
  }, [dataModels, search])
  
  function rateModel(e, modelid) {
    addToast('Superstar!', { 
      appearance: 'success',
      autoDismiss: true,
      autoDismissTimeout: 3000
    });
  }

  function getResultsUI(dataModels) {
    let resultsRows = [];

    for(let model of dataModels) {
      let id = model[0];
      let name = model[0].split('-').map(x => x[0].toUpperCase() + x.slice(1)).join(' ');
      let version = model[1];
      let author = model[2];
      let tags = model[3];
      let github = `https://github.com/ceramicstudio/datamodels/tree/main/packages/${id}`;
      let npm = `@datamodels/${id}`;
      let npmLink = `https://www.npmjs.com/package/@datamodels/${id}`;

      let ownRating = ownRatings[id];
      let ratingStr = '0 ratings';

      resultsRows.push(
        <div className={styles.dataModelResult} key={id}>
          <div className={styles.dataModelResultHeader}>
            <div className={styles.dataModelHeaderName}>{name}</div>
          </div>
          <div className={styles.dataModelResultContent}>
            <div className={styles.dataModelResultInfo}>
              <div className={styles.dataModelResultRow}>
                <div className={styles.dataModelResultTitle}>NPM Package</div>
                <div className={styles.dataModelResultValue}>
                  <a href={npmLink} target="_blank" rel="noreferrer">
                    {npm}
                  </a>
                </div>
              </div>
              <div className={styles.dataModelResultRow}>
                <div className={styles.dataModelResultTitle}>Version</div>
                <div className={styles.dataModelResultValue}>{version}</div>
              </div>
              <div className={styles.dataModelResultRow}>
                <div className={styles.dataModelResultTitle}>Author</div>
                <div className={styles.dataModelResultValue}>{author}</div>
              </div>
              <div className={styles.dataModelResultRow}>
                <div className={styles.dataModelResultTitle}>Tags</div>
                <div className={styles.dataModelResultValue}>{tags}</div>
              </div>
            </div>
            <div className={styles.dataModelResultControls}>
              <button>Select</button>
              <div className={styles.dataModelResultRatingPanel}>
                <Image className={styles.dataModelRatingStar} src="/hp_gold_star.svg" onClick={e => {rateModel(e, id)}}
                       alt="Rate data model" width="30" height="30" />
                {ratingStr}
              </div>
            </div>
         </div>
        </div>
      )
    }

    return resultsRows;
  }

  return (
      <Container className="md-container">
        <Head>
          <title>Ceramic Data Model Explorer</title>
          <link rel="icon" href="/favicon-32x32.png" />
        </Head>
        <Container>
          <h2>
            <Image src="explorer-192.png" width="60" />&nbsp;
            Ceramic Data Model Explorer
          </h2>

          <div>
            <input type="text" value={search} onChange={e => setSearch(e.target.value)} placeholder="Search for data model..." />
          </div>
          <div>
            {getResultsUI(matchingDataModels)}
          </div>

          <footer className="cntr-footer">
          </footer>
        </Container>
      </Container>
  )
}
