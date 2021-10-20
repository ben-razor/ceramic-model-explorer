import { useEffect, useState } from 'react';
import Image from 'next/image';
import styles from '../../style/App.module.css'

function Search(props) {

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



    return <div className={styles.searchPanel}>
        <div className={styles.csnBasicSearchBar}>
        <input className={styles.csnSearchInput} type="text" value={search} onChange={e => setSearch(e.target.value)} placeholder="Search for data model..." />
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

export default Search;
