import React from 'react';
import { Link } from "react-router-dom";
import { Highlight } from "react-instantsearch";

export const UserHit = ({ hit }) => {
  return (
    <Link to={`/user/${hit.objectID}`} className="block w-full">
      <article className="w-full mx-0 p-3 flex items-center space-x-4 bg-white hover:bg-gray-100 rounded-lg shadow">
        <img src={hit.avatar || 'https://flowbite.com/docs/images/people/profile-picture-5.jpg'} alt={hit.name} className="w-12 h-12 rounded-full"/>
        <div className="flex flex-col flex-grow">
          <div className="user-name text-sm font-semibold">
            <Highlight attribute="name" hit={hit} tagName="mark" />
          </div>

        </div>
      </article>
    </Link>
  );
};
