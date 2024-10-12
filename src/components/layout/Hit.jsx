import React, { useState, useEffect } from 'react';
import { Link } from "react-router-dom";
import { Highlight } from "react-instantsearch";
import { getPropertyByPath } from 'instantsearch.js/es/lib/utils';
import { db } from '../../firebase.config'; // Ensure you have the correct path
import { doc, getDoc } from 'firebase/firestore';

// Helper function to strip HTML and truncate text
function truncateText(text, maxLength) {
  const strippedString = text.replace(/(<([^>]+)>)/gi, ""); // Remove HTML
  return strippedString.length > maxLength ? `${strippedString.substring(0, maxLength)}...` : strippedString;
}

export const Hit = ({ hit }) => {
  const [userName, setUserName] = useState("");

  useEffect(() => {
    const fetchUserName = async () => {
      if (hit.userRef) {
        const userDocRef = doc(db, "users", hit.userRef);
        const userDoc = await getDoc(userDocRef);
        if (userDoc.exists()) {
          setUserName(userDoc.data().name); // Assuming the user's name is stored under 'name'
        } else {
          setUserName("Unknown User");
        }
      }
    };

    fetchUserName();
  }, [hit.userRef]);

  const handleLinkClick = (e) => {
    e.stopPropagation();
  };

  return (
    <Link to={`/listing/${hit.objectID}`} className="block w-full" onClick={handleLinkClick}>
      <article className="w-full mx-0 p-2 flex items-center space-x-4 bg-white hover:bg-gray-100 rounded-lg shadow">
        <img src={hit.imgUrls[0]} alt="" className="w-10 h-10 rounded-md"/>
        <div className="flex flex-col flex-grow">
          <div className="hit-title text-sm font-semibold">
            <Highlight attribute="title" hit={hit} tagName="mark" />
          </div>
          <div className="hit-name text-xs text-gray-500">
            {userName} {/* Display the fetched user name */}
          </div>
        </div>
      </article>
    </Link>
  );
};
