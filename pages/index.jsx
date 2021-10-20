import Head from 'next/head'
import { useEffect, useState } from 'react'
import { Container, Row, Card, Button } from 'react-bootstrap'
import { Image } from 'react-bootstrap'
import ApiGithub from '../lib/ApiGithub'
import { isLocal } from '../lib/helpersHTML'
import styles from '../style/App.module.css'
import { ToastProvider, useToasts } from 'react-toast-notifications';
import CeramicClient from '@ceramicnetwork/http-client';
import ThreeIdResolver from '@ceramicnetwork/3id-did-resolver';
import { ThreeIdConnect,  EthereumAuthProvider } from '@3id/connect'
import { TileDocument } from '@ceramicnetwork/stream-tile'
import Applications from './components/Applications'
import DataModel from './components/DataModel'
import { DID } from 'dids'
const API_URL = 'https://ceramic-clay.3boxlabs.com';
const TOAST_TIMEOUT = 5000;

export default function Home() {

  const [host, setHost] = useState('');
  const [search, setSearch] = useState('');
  const [dataModels, setDataModels] = useState([]);
  const [matchingDataModels, setMatchingDataModels] = useState([]);
  const [modelRatings, setModelRatings] = useState({});
  const [ownRatings, setOwnRatings] = useState({});
  const [connecting, setConnecting] = useState(false);
  const [searchOrder, setSearchOrder] = useState('')
  const [selectedModel, setSelectedModel] = useState('');
  const { addToast } = useToasts();

  const [ceramic, setCeramic] = useState();
  const [ethAddresses, setEthAddresses] = useState();
  const [ethereum, setEthereum] = useState();

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
    if(ceramic && dataModels) {
      let userID = ceramic.did.id;

      (async() => {
        let r = await fetch(host + '/api/rate?' + new URLSearchParams({
          'userid': userID 
        }))

        let j = await r.json();
        if(j.success) {
          setOwnRatings(ratingTuplesToObj(j.data));
        }
        else {
          console.log(j.reason);
        }
      })();
    }
  }, [ceramic, dataModels]);

  useEffect(() => {
    if(ethereum && ethAddresses && !ceramic) {
      (async () => {
        try {
          const newCeramic = new CeramicClient(API_URL);

          const resolver = {
            ...ThreeIdResolver.getResolver(newCeramic),
          }
          const did = new DID({ resolver })
          newCeramic.did = did;
          const threeIdConnect = new ThreeIdConnect()
          const authProvider = new EthereumAuthProvider(ethereum, ethAddresses[0]);
          await threeIdConnect.connect(authProvider)

          const provider = await threeIdConnect.getDidProvider();
          newCeramic.did.setProvider(provider);
          await newCeramic.did.authenticate();

          setCeramic(newCeramic);
          setConnecting(false);
        }
        catch(e) {
          console.log(e);
        }
        finally {
          setConnecting(false);
        }
      })();
    }
  }, [ethereum, ethAddresses, ceramic]);
  
  useEffect(() => {
    if(dataModels) {
      let _dataModels = [...dataModels];
      let _matchingDataModels = _dataModels.filter(model => {
        let id = model[0].toLowerCase();
        let name = model[0].split('-').map(x => x[0].toUpperCase() + x.slice(1)).join(' ').toLowerCase();
        let version = model[1].toLowerCase();
        let author = model[2].toLowerCase();
        let tags = model[3].toLowerCase();
        let readme = model[4].toLowerCase();
        let lcSearch = search.toLowerCase();

        return id.includes(lcSearch) || name.includes(lcSearch) || tags.includes(lcSearch) || readme.includes(lcSearch);
      })

      if(searchOrder) {
        if(searchOrder === 'newest') {
          _matchingDataModels.reverse();
        }
        else if(searchOrder === 'highest-rated') {
          _matchingDataModels.sort((a, b) => {
            let id1 = a[0];
            let id2 = b[0];
            let rating1 = modelRatings[id1] || 0;
            let rating2 = modelRatings[id2] || 0;
            return rating2 - rating1;
          })
        }
      }

      setMatchingDataModels(_matchingDataModels);
    }
  }, [dataModels, search, searchOrder])
  
  useEffect(() => {
    if(dataModels && host) {
      (async() => {
        let r = await fetch(host + '/api/get_model_ratings');
        let j = await r.json();
        if(j.success) {

          let _modelRatings = {};
          for(let ratingInfo of j.data) {
            let modelid = ratingInfo[0];
            let rating = ratingInfo[1];
            _modelRatings[modelid] = rating;
          }
          setModelRatings(_modelRatings);
        }
      })();
    }
  }, [dataModels, ownRatings, host])
  
  useEffect(() => {

  }, [selectedModel]);

  function rateModel(e, modelid) {
    if(ceramic) {
      toast('Superstar!');

      let userID = ceramic.did.id;
      let rating = 10;

      if(ownRatings[modelid] && ownRatings[modelid].rating) {
        rating = 0;
      }

      (async() => {
        let r = await fetch(host + '/api/rate', {
          method: 'POST',
          headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            userid: userID,
            modelid: modelid,
            rating: rating,
            comment: ''
          })
        });

        let j = await r.json();
        if(j.success) {
          setOwnRatings(ratingTuplesToObj(j.data));
        }
        else {
          console.log(j.reason);
        }
      })();
    }
    else {
      toast('Connect to rate models');
    }
  }

  function ratingTuplesToObj(ratingTuples) {
    let ratingObj = {};
    for(let t of ratingTuples) {
      let userid = t[0];
      let modelid = t[1];
      let rating = t[2];
      let comment = t[3];
      
      ratingObj[modelid] = {
        userid: userid,
        rating: rating,
        comment: comment
      }
    }

    return ratingObj;
  }

  function toast(message, type='info') {
    addToast(message, { 
      appearance: type,
      autoDismiss: true,
      autoDismissTimeout: TOAST_TIMEOUT
    });
  }

  function connectAccount(e) { 
    if(window.ethereum) {
      setEthereum(window.ethereum);
      (async() => {
        try {
          setConnecting(true);
          const addresses = await window.ethereum.request({ method: 'eth_requestAccounts'})
          if(addresses) {
            setEthAddresses(addresses);
          }
        }
        catch(e) { 
          console.log(e);
          setConnecting(false);
        }
      })();
    }
    else {
      toast('You need Ethereum. Try MetaMask!', 'warning');
    }
    e.preventDefault();
  }

  function displayBasicModelInfo(modelid, version, author, tags) {
    let npm = `@datamodels/${modelid}`;
    let npmLink = `https://www.npmjs.com/package/@datamodels/${modelid}`;
    return <div>
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

      let ownRating = 0;
      let ownRatingDetails = ownRatings[id];
      if(ownRatingDetails) {
        ownRating = ownRatingDetails.rating;
      }

      let ratingStr = '0';

      if(modelRatings[id]) {
        ratingStr = Math.round(modelRatings[id] / 10);
      }

      resultsRows.push(
        <div className={styles.dataModelResult} key={id}>
          <div className={styles.dataModelResultHeader}>
            <div className={styles.dataModelHeaderName}>{name}</div>
          </div>
          <div className={styles.dataModelResultContent}>
            <div className={styles.dataModelResultInfo}>
              { displayBasicModelInfo(id, version, author, tags) }
            </div>
            <div className={styles.dataModelResultControls}>
              <button onClick={e => setSelectedModel(id)}>Select</button>
              <div className={styles.dataModelResultRatingPanel}>
                { ownRating ?
                  <Image className={styles.dataModelRatingStar} src="/hp_gold_star.svg" onClick={e => {rateModel(e, id)}}
                         alt="Rate data model" width="30" height="30" /> :

                  <Image className={styles.dataModelRatingStar} src="/hp_star_no_fill.svg" onClick={e => {rateModel(e, id)}}
                         alt="Rate data model" width="30" height="30" />
                }
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
    <div>
      <Head>
        <title>Ceramic Data Model Explorer</title>
        <link rel="icon" href="/favicon-32x32.png" />
      </Head>
      <div className={styles.csnTopBar}>
        <h2>
          <Image src="explorer-192.png" width="60" />&nbsp;
          Ceramic Data Model Explorer
        </h2>
        <div className={styles.csnHeaderControls}>
          { ceramic ?
            <button className={styles.csnConnectButton} onClick={e => connectAccount(e)} disabled>Connected</button> :
            (
              !connecting ?
                <button className={styles.csnConnectButton} onClick={e => connectAccount(e)}>Connect</button> :
                <button className={styles.csnConnectButton} onClick={e => connectAccount(e)}>Connecting...</button>
            )
          }
        </div>
      </div>

      <Container className="md-container">
        {!selectedModel &&
          <div>
            <div className={styles.csnBasicSearchBar}>
              <input className={styles.csnSearchInput} type="text" value={search} onChange={e => setSearch(e.target.value)} placeholder="Search for a data model..." />
              <select className={styles.csnSearchOrderSelect} onChange={e => setSearchOrder(e.target.value)}>
                <option value="">Classics</option>
                <option value="newest">Newest</option>
                <option value="highest-rated">Highest Rated</option>
              </select>
            </div>
            <div>
              {getResultsUI(matchingDataModels)}
            </div>
          </div>
        }

        {selectedModel && 
          <DataModel setSelectedModel={setSelectedModel} selectedModel={selectedModel} host={host} 
                     displayBasicModelInfo={displayBasicModelInfo} />
        }

        <footer className="cntr-footer">
        </footer>
      </Container>
    </div>
  )
}
