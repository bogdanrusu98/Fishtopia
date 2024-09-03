import { useEffect, useState } from "react"
import { Link } from "react-router-dom"
import {ReactComponent as DeleteIcon} from '../../assets/svg/deleteIcon.svg'


function FishResults( {listing, id, onDelete}) {
    const [fishes, setFishes] = useState([])


    const fetchFishes = async() => {
        const response = await fetch(`${process.env.REACT_APP_FISH_URL}/fishes`, {
            headers: {
                Authorization: `token ${process.env.REACT_APP_FISH_TOKEN}`
            }
        } )

        const data = await response.json()

        setFishes(data)
    }
  return (
    
    
  <div className="max-w-sm bg-white border border-gray-200 rounded-lg shadow dark:bg-gray-800 dark:border-gray-700">
    <Link to={`/listing/${id}`}>
      <img className="rounded-t-lg" src={listing.imgUrls} alt="" />
    </Link>
    <div className="p-5">
    <Link to={`/listing/${id}`}>
        <h5 className="mb-2 text-2xl font-bold tracking-tight text-gray-900 dark:text-white">{listing.name}</h5>
      </Link>
      <ul className="mb-3 font-normal text-gray-700 dark:text-gray-400">
        <li>Țara: {listing.country}</li>
        <li>Risc: {listing.risk}</li>
        <li>Lungime: {listing.length}</li>
        <li>Greutate: {listing.weight}</li>
      </ul>
      <Link to={`/listing/${id}`} className="inline-flex items-center px-3 py-2 text-sm font-medium text-center text-white bg-blue-700 rounded-lg hover:bg-blue-800 focus:ring-4 focus:outline-none focus:ring-blue-300 dark:bg-blue-600 dark:hover:bg-blue-700 dark:focus:ring-blue-800">
        Read more
      </Link>

      {onDelete && (
            <DeleteIcon className="removeIcon inline float-right" fill="rgb(231, 76, 60)" onClick={() => onDelete(listing.id, listing.name)} />
        )}

    </div>
  </div>
 






  )
}

export default FishResults
