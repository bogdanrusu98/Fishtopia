import { Highlight } from "react-instantsearch-dom";

export const Hit = ({ hit }) => {
  return (
    <article className="hit-item">
      {/* Afișează prima imagine dacă există */}
      {hit.imgUrls && hit.imgUrls[0] && (
        <img src={hit.imgUrls[0]} alt={hit.title || 'Listing Image'} className="hit-image" />
      )}
      
      <div className="hit-content">
        <div className="hit-title">
          {/* Afișează titlul cu highlighting dacă este găsit în query */}
          <Highlight attribute="title" hit={hit} />
        </div>

        <div className="hit-description">
          {/* Afișează descrierea cu highlighting */}
          <Highlight attribute="description" hit={hit} />
        </div>

        <div className="hit-name">
          {/* Afișează numele cu highlighting */}
          <Highlight attribute="name" hit={hit} />
        </div>
      </div>
    </article>
  );
};
