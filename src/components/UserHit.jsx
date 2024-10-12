import React from 'react';
import { Link } from "react-router-dom";
import { Highlight } from "react-instantsearch";

export const UserHit = ({ hit }) => {
  return (
    <Link to={`/user/${hit.objectID}`} className="block w-full">
      <article className="w-full mx-0 p-3 flex items-center space-x-4 bg-white hover:bg-gray-100 rounded-lg shadow">
        <img src={hit.profilePicUrl || 'default_profile_pic.png'} alt={hit.name} className="w-12 h-12 rounded-full"/>
        <div className="flex flex-col flex-grow">
          <div className="user-name text-lg font-semibold">
            <Highlight attribute="name" hit={hit} tagName="mark" />
          </div>
          <div className="user-email text-sm text-gray-500">
            <Highlight attribute="email" hit={hit} tagName="mark" />
          </div>
        </div>
      </article>
    </Link>
  );
};
