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
import Applications from '../components/Applications'
import DataModel from '../components/DataModel'
import UserModels from '../components/UserModels'

import { DID } from 'dids'
let API_URL = process.env.CERAMIC_URL || 'https://ceramic-clay.3boxlabs.com';
const TOAST_TIMEOUT = 5000;
let CME_SERVER_PORT = process.env.CME_SERVER_PORT || 8879;

export default function Home() {

  const [host, setHost] = useState('');
  const [search, setSearch] = useState('');
  const [dataModels, setDataModels] = useState([]);
  const [modelStats, setModelStats] = useState({});
  const [matchingDataModels, setMatchingDataModels] = useState([]);
  const [modelRatings, setModelRatings] = useState({});
  const [userModels, setUserModels] = useState({});
  const [ownRatings, setOwnRatings] = useState({});
  const [connecting, setConnecting] = useState(false);
  const [searchOrder, setSearchOrder] = useState('')
  const [selectedModel, setSelectedModel] = useState('');
  const [applications, setApplications] = useState([]);
  const [applicationCount, setApplicationCount] = useState({});
  const [userModelAdding, setUserModelAdding] = useState(false);
  const [page, setPage] = useState('');
  const [error, setError] = useState('');
  const { addToast } = useToasts();

  const [ceramic, setCeramic] = useState();
  const [ethAddresses, setEthAddresses] = useState();
  const [ethereum, setEthereum] = useState();
  const [jws, setJWS] = useState();

  useEffect(() => {
    let _host = `https://benrazor.net:${CME_SERVER_PORT}`;
    if(isLocal()) {
        _host = `https://localhost:${CME_SERVER_PORT}`;
    }

    setHost(_host);
  }, [])

  useEffect(() => {
    if(host) {
      (async() => {

        try {
          let r = await fetch(host + '/api/search_models?' + new URLSearchParams({
            'search': ''
          }))

          let j = await r.json();

          setDataModels(j.data);
          setMatchingDataModels(j.data);
          setUserModelAdding(false);

          let rStats = await fetch(host + '/api/stats');
          let jStats = await rStats.json();
          let stats = {}
          if(jStats.success) {
            for(let row of jStats.data) {
              let modelid = row.modelid;
              let monthly_downloads = row.monthly_downloads;
              let npm_score = row.npm_score;
              let npm_quality = row.npm_quality;
              let num_streams = row.num_streams;
              stats[modelid] = {
                monthly_downloads: monthly_downloads,
                npm_score: npm_score,
                npm_quality: npm_quality,
                num_streams: num_streams
              }
            }
          }
          setModelStats(stats);
        }
        catch(e) {
          setError('Error connecting to model server. Try again later.');
          console.log(e);
        }
      })();
    }
  }, [host, userModelAdding]);

  useEffect(() => {
    if(ceramic && dataModels) {
      let userID = ceramic.did.id;

      (async() => {
        try {
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
        }
        catch(e) {
          console.log(e);
        }
      })();
    }
  }, [ceramic, dataModels]);
  
  useEffect(() => {
    if(dataModels && host) {
      (async() => {
        try {
          let r = await fetch(host + '/api/user_models')
          let j = await r.json();

          if(j.success) {
            let _userModels = {};
            for(let info of j.data) {
              let modelid = info.modelid;
              let userid = info.userid;
              let packageid = info.npm_package;
              let repo_url = info.repo_url;
              let status = info.status;
              let updated = info.last_updated;

              _userModels[modelid] = {
                'userid': userid,
                'packageid': packageid,
                'repo_url': repo_url,
                'status': status,
                'updated': updated
              }
            }
            setUserModels(_userModels);
          }
          else {
            console.log(j.reason);
          }
        }
        catch(e) {
          console.log(e);
        }
      })();
    }
  }, [dataModels, host]);

  function applicationResultToObj(application) {
    return {
      applicationid: application.applicationid,
      name: application.name,
      image_url: application.image_url,
      description: application.description,
      userid: application.userid,
      app_url: application.app_url,
      last_updated: application.last_updated,
      modelids: application.modelid
    }
  }

  useEffect(() => {
    if(dataModels && host) {
      (async() => {
        try {
          let r = await fetch(host + '/api/applications')
          let j = await r.json();

          if(j.success) {
            let _applicationCount = {};
            let _applications = [];
            for(let info of j.data) {
              let applicationData = info;

              let modelids = applicationData.modelid;
              for(let modelid of modelids) {
                if(_applicationCount[modelid]) {
                  _applicationCount[modelid]++;
                }
                else {
                  _applicationCount[modelid] = 1;
                }
              }
              _applications.push(applicationData);
            }
            setApplications(_applications);
            setApplicationCount(_applicationCount);
          }
          else {
            console.log(j.reason);
          }
        }
        catch(e) {
          console.log(e);
        }
      })();
    }
  }, [dataModels, host]);

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

          let _jws = await did.createJWS({ userid: did.id });

          try {
            let jwsObj = JSON.parse(JSON.stringify(_jws));
            setJWS(jwsObj);
          }
          catch(e) {
            console.log(e);
          }

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
        let id = model.modelid.toLowerCase();
        let name = model.modelid.split('-').map(x => x[0].toUpperCase() + x.slice(1)).join(' ').toLowerCase();
        let tags = model.keywords.toLowerCase();
        let readme = model.readme.toLowerCase();
        let lcSearch = search.toLowerCase();

        return id.includes(lcSearch) || name.includes(lcSearch) || tags.includes(lcSearch) || readme.includes(lcSearch);
      })

      if(searchOrder) {
        if(searchOrder === 'newest') {
          _matchingDataModels.reverse();
        }
        else if(searchOrder === 'highest-rated') {
          _matchingDataModels.sort((a, b) => {
            let id1 = a.modelid;
            let id2 = b.modelid;
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
        try {
          let r = await fetch(host + '/api/get_model_ratings');
          let j = await r.json();
          if(j.success) {

            let _modelRatings = {};
            for(let ratingInfo of j.data) {
              let modelid = ratingInfo.modelid;
              let rating = ratingInfo.total;
              _modelRatings[modelid] = rating;
            }
            setModelRatings(_modelRatings);
          }
        }
        catch(e) {
          console.log(e);
        }
        
      })();
    }
  }, [dataModels, ownRatings, host])
  
  useEffect(() => {

  }, [selectedModel]);

  function goBack() {
    setSelectedModel('');
    setPage('');
  }

  function rateModel(e, modelid) {
    if(ceramic) {

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
            comment: '',
            jws: jws
          })
        });

        let j = await r.json();
        if(j.success) {
          if(rating) {
            toast('Superstar!');
          }
          else {
            toast('Star removed from Data Model');
          }
          setOwnRatings(ratingTuplesToObj(j.data));
        }
        else {
          toast('Error rating model: ' + j.reason, 'error');
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
      let userid = t.userid;
      let modelid = t.modelid;
      let rating = t.rating;
      let comment = t.comment;
      
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

  function displayBasicModelInfo(modelid, version, author, tags, monthly_downloads, npm_score, userModelInfo, applicationCount) {
    let npmLink = `https://www.npmjs.com/package/{package_name}`;
    let packageName = `@datamodels/${modelid}`;

    if(userModelInfo) {
      packageName = userModelInfo.packageid;
    }

    return <div>
      <div className={styles.dataModelResultRow}>
        <div className={styles.dataModelResultTitle}>NPM Package</div>
        <div className={styles.dataModelResultValue}>
          <a href={npmLink} target="_blank" rel="noreferrer">
            {packageName}
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
      <div className={styles.dataModelResultRow}>
        <div className={styles.dataModelResultTitle}><span className={styles.hoverTitle} title="Monthly Downloads">Downloads</span></div>
        <div className={styles.dataModelResultValue}>{monthly_downloads}</div>
      </div>
      <div className={styles.dataModelResultRow}>
        <div className={styles.dataModelResultTitle}>Applications</div>
        <div className={styles.dataModelResultValue}>{applicationCount}</div>
      </div>
    </div>
  }

  function getResultsUI(dataModels) {
    let resultsRows = [];

    for(let model of dataModels) {
      let id = model.modelid;
      let name = model.modelid.split('-').map(x => x[0].toUpperCase() + x.slice(1)).join(' ');
      let version = model.version;
      let author = model.author;
      let tags = model.keywords;
      let packageName;
      let userModelInfo;

      if(userModels && userModels[id]) {
        userModelInfo = userModels[id];
      }
      else {
        packageName = '@datamodels/' + id;
      }

      let numApplications = 0;
      if(applicationCount && applicationCount[id]) {
        numApplications = applicationCount[id];
      }

      let monthly_downloads = 0;
      let npm_score = 0;
      if(modelStats[id]) {
        monthly_downloads = modelStats[id].monthly_downloads || 0;
        npm_score = modelStats[id].npm_score || 0;
      }
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
          <div className={!userModelInfo ? styles.dataModelResultHeader : styles.userModelResultHeader}>
            <div className={styles.dataModelHeaderName}>{name}</div>
          </div>
          <div className={styles.dataModelResultContent}>
            <div className={styles.dataModelResultInfo}>
              { displayBasicModelInfo(id, version, author, tags, monthly_downloads, npm_score, userModelInfo, numApplications) }
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


  function getSearchPage() {
    return <div>
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

  function getDataModelPage() {
    return <DataModel setSelectedModel={setSelectedModel} selectedModel={selectedModel} host={host} 
                displayBasicModelInfo={displayBasicModelInfo} goBack={goBack} />
  }

  function getUserModelsPage() {
    return <UserModels goBack={goBack} host={host} ceramic={ceramic} toast={toast} jws={jws} 
                       userModels={userModels} setUserModelAdding={setUserModelAdding} />
  }

  function getApplicationsPage() {
    return <Applications goBack={goBack} host={host} ceramic={ceramic} toast={toast} 
                         applications={applications} setApplications={setApplications} 
                         applicationResultToObj={applicationResultToObj} jws={jws} />
  }

  function getPageID() {
    let pageID = page;

    if(!pageID) {
      if(selectedModel) {
        pageID = 'data-model';
      }
      else {
        pageID = 'search';
      }
    }
    return pageID;
  }

  let pageID = getPageID();

  return (
    <div>
      <Head>
        <title>Ceramic Data Model Explorer</title>
        <link rel="icon" href="/favicon-32x32.png" />
      </Head>
      <div className={styles.csnTopBar}>
        <h2 className={styles.csnHeaderTitlePanel}>
          <Image className={styles.csnHeaderLogo} src="explorer-192.png" width="40" height="40" />&nbsp;
          Ceramic Data Model Explorer
        </h2>
        <div className={styles.csnHeaderControls}>
          <div className={styles.csnHeaderMenu}>
            <div className={styles.csnHeaderMenuItem}>
              <button className={styles.csnLinkButton} onClick={e => setPage('user-models')}>User Models</button>
            </div>
            <div className={styles.csnHeaderMenuItem}>
              <button className={styles.csnLinkButton} onClick={e => setPage('applications')}>Applications</button>
            </div>
            <div className={styles.csnHeaderMenuItem}>
              <a href="https://ceramic-explore-docs.web.app/" target="_blank" rel="noreferrer">Documentation</a>
            </div>
          </div>
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
        { error && <h4>{error}</h4> }

        { !error && (pageID === 'search') && getSearchPage()}
        { !error && (pageID === 'data-model') && getDataModelPage()}
        { !error && (pageID === 'user-models') && getUserModelsPage()}
        { !error && (pageID === 'applications') && getApplicationsPage()}

        <footer className="cntr-footer">
        </footer>
      </Container>
    </div>
  )
}
