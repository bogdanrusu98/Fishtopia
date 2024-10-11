import React from 'react';
import { InstantSearch, Hits, SearchBox, Configure } from 'react-instantsearch-dom';
import { Hit } from '../components/Hit'; // Importă componenta Hit
import { liteClient as algoliasearch } from "algoliasearch/lite";
import { Highlight } from "react-instantsearch";
import { getPropertyByPath } from 'instantsearch.js/es/lib/utils';
const algoliaAppId = process.env.REACT_APP_ALGOLIA_APP_ID
const algoliaApiKey = process.env.REACT_APP_ADMIN_KEY
// Inițializează Algolia Search Client
const searchClient = algoliasearch(
    'NXODB690MA', // App ID corect din Algolia Dashboard
    '1fb0e246adff0fb2d32485951ad394b1' // Cheie API corectă
  );
const Search = () => {
    const Hit = ({ hit }) => {
        return (
          <article>
            <img src={hit.imgUrls} />
                  <div className="hit-title">
                    <Highlight attribute="title" hit={hit} />
                  </div>
                  <div className="hit-description">
                    <Highlight attribute="description" hit={hit} />
                  </div>
                  <div className="hit-name">
                    <Highlight attribute="name" hit={hit} />
                  </div>
          </article>
        );
      };
};

export default Search;
