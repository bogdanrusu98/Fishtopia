import React, { useEffect, useState } from 'react';
import { collection, getDocs, addDoc, query, where, updateDoc, doc, arrayUnion, serverTimestamp, getDoc, deleteDoc } from 'firebase/firestore';
import { db } from '../firebase.config';
import { useUser } from '../hooks/userContext';
import { useParams, Link } from 'react-router-dom';
import { toast } from 'react-toastify';
import { formatDistanceToNow } from 'date-fns';
import { FaEdit, FaTrashAlt } from "react-icons/fa";
import { Dropdown } from "flowbite-react";
import sendNotification from "../hooks/sendNotification";

function Comments() {
  const { listingId } = useParams(); // Obține ID-ul listingului din URL
  const [comments, setComments] = useState([]);
  const [newCommentText, setNewCommentText] = useState('');
  const [replyText, setReplyText] = useState('');
  const [activeReplyId, setActiveReplyId] = useState(null);
  const user = useUser(); // Obține user-ul conectat
  const [listingOwner, setListingOwner] = useState(null); // Stocăm UID-ul proprietarului listingului

  // Funcție pentru a prelua detaliile listingului
  const fetchListingOwner = async () => {
    try {
      const listingDoc = await getDoc(doc(db, "listings", listingId));
      if (listingDoc.exists()) {
        const listingData = listingDoc.data();
        setListingOwner(listingData.userRef); // Stocăm UID-ul proprietarului listingului
        console.log(listingOwner)

      } else {
        console.error("Listing not found");
      }
    } catch (error) {
      console.error("Error fetching listing owner:", error);
    }
  };

  // Preluăm comentariile și afișăm în componentă
  const fetchComments = async (listingId) => {
    const q = query(collection(db, "comments"), where("listingRef", "==", listingId));
    const querySnapshot = await getDocs(q);
    const commentList = querySnapshot.docs.map((doc) => ({
      ...doc.data(),
      comId: doc.id,
      timestampFormatted: doc.data().timestamp?.seconds
        ? formatDistanceToNow(new Date(doc.data().timestamp.seconds * 1000), { addSuffix: true })
        : 'Invalid timestamp',
    }));
    setComments(commentList);
  };

  // Efect pentru a prelua comentariile și UID-ul proprietarului listingului la montarea componentei
  useEffect(() => {
    if (listingId) {
      fetchComments(listingId);
      fetchListingOwner(); // Preia UID-ul proprietarului listingului
    }
  }, [listingId]);

  // Funcție pentru a adăuga comentarii
  const handleAddComment = async (e) => {
    e.preventDefault();
    if (!newCommentText.trim()) {
      toast.error('Comment cannot be empty');
      return;
    }

    const newComment = {
      userId: user.uid,
      fullName: user.displayName || 'Anonymous',
      avatarUrl: user.photoURL || "https://flowbite.com/docs/images/people/profile-picture-5.jpg",
      text: newCommentText,
      replies: [],
      listingRef: listingId,
      timestamp: serverTimestamp(),
    };

    try {
      await addDoc(collection(db, 'comments'), newComment);
      setNewCommentText('');
      fetchComments(listingId);
      toast.success('Comment added successfully');

      // Trimitere notificare către proprietarul listingului
      if (listingOwner && listingOwner !== user.uid) {
        await sendNotification({
          userRef: listingOwner, // UID-ul proprietarului
          message: `${user.displayName || 'Anonymous'} commented on your listing.`,
        });
      }

    } catch (error) {
      console.error('Error adding comment:', error);
      toast.error('Failed to add comment');
    }
  };

  const handleReplyComment = async (commentId) => {
    if (!replyText.trim()) {
      toast.error('Reply cannot be empty');
      return;
    }

    const commentRef = doc(db, "comments", commentId);
    const replyId = new Date().getTime(); // Generăm un ID temporar pentru reply

    const replyData = {
      text: replyText,
      userId: user.uid,
      fullName: user.displayName || 'Anonymous',
      avatarUrl: user.photoURL || "https://flowbite.com/docs/images/people/profile-picture-5.jpg",
      timestamp: null, // Temporar punem `null` pentru timestamp
    };

    try {
      // Adăugăm reply-ul în array cu timestamp `null`
      await updateDoc(commentRef, {
        [`replies.${replyId}`]: replyData,
      });

      // Actualizăm reply-ul să aibă un timestamp corect folosind `serverTimestamp()`
      await updateDoc(commentRef, {
        [`replies.${replyId}.timestamp`]: serverTimestamp(),
      });

      setReplyText('');
      setActiveReplyId(null);
      fetchComments(listingId);
      toast.success('Reply added successfully');
    } catch (error) {
      console.error('Error adding reply:', error);
      toast.error('Failed to add reply');
    }
  };

  // Funcție pentru a șterge un comentariu
  const onDelete = async (commentId) => {
    if (window.confirm('Are you sure you want to delete?')) {
      await deleteDoc(doc(db, 'comments', commentId));
      const updatedComments = comments.filter((comment) => comment.comId !== commentId);
      setComments(updatedComments);
      toast.success('Successfully deleted comment');
    }
  };
  return (
    <div>
      <section className="bg-white dark:bg-gray-900 py-4 lg:py-4 antialiased">
        <div className="max-w-2xl mx-4 px-4">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-lg lg:text-2xl font-bold text-gray-900 dark:text-white">
              Discussion ({comments.length})
            </h2>
          </div>
  
          {/* Formularul pentru a adăuga comentarii */}
          <form className="mb-6" onSubmit={handleAddComment}>
            <div className="py-2 px-4 mb-4 bg-white rounded-lg rounded-t-lg border border-gray-200 dark:bg-gray-800 dark:border-gray-700">
              <label htmlFor="comment" className="sr-only">
                Your comment
              </label>
              <textarea
                id="comment"
                rows="6"
                className="px-0 w-full text-sm text-gray-900 border-0 focus:ring-0 focus:outline-none dark:text-white dark:placeholder-gray-400 dark:bg-gray-800"
                placeholder="Write a comment..."
                value={newCommentText}
                onChange={(e) => setNewCommentText(e.target.value)}
                required
              />
            </div>
            <button
              type="submit"
              className="inline-flex items-center py-2.5 px-4 text-xs font-medium text-center text-white bg-primary rounded-lg focus:ring-4 focus:ring-primary-200 dark:focus:ring-primary-900 hover:bg-primary-800"
            >
              Post comment
            </button>
          </form>
  
          {/* Afișarea comentariilor */}
          {comments.map((comment) => (
            <article key={comment.comId} className="p-6 pb-3 mb-3 text-base bg-white border-t border-gray-200 dark:border-gray-700 dark:bg-gray-900">
              <footer className="flex items-center mb-2">
                <div className="flex items-center">
                  <p className="inline-flex items-center mr-3 text-sm text-gray-900 dark:text-white font-semibold">
                    <Link to={`/user/${comment.userId}`}>
                      <img
                        className="mr-2 w-6 h-6 rounded-full object-cover"
                        src={comment.avatarUrl}
                        alt={comment.fullName}
                      />
                    </Link>
                    {comment.fullName}
                  </p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    <time pubdate datetime={comment.timestamp?.toDate().toISOString()} title={comment.timestamp?.toDate().toLocaleString()}>
                      {comment.timestampFormatted}
                    </time>
                  </p>
                </div>
                {user && user.uid === comment.userId ? (
                  <div className="ml-auto">
                    {/* Dropdown pentru butonul cu 3 puncte */}
                    <Dropdown
                      arrowIcon={false}
                      inline={true}
                      label={
                        <svg className="w-5 h-5 items-end" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="currentColor" viewBox="0 0 4 15">
                          <path d="M3.5 1.5a1.5 1.5 0 1 1-3 0 1.5 1.5 0 0 1 3 0Zm0 6.041a1.5 1.5 0 1 1-3 0 1.5 1.5 0 0 1 3 0Zm0 5.959a1.5 1.5 0 1 1-3 0 1.5 1.5 0 0 1 3 0Z" />
                        </svg>
                      }
                    >
                      <Dropdown.Item onClick={() => onDelete(comment.comId)}>
                        <FaTrashAlt className="mr-2" />
                        Delete
                      </Dropdown.Item>
                    </Dropdown>
                  </div>
                ) : null}
              </footer>
              <p className="text-gray-500 dark:text-gray-400">{comment.text}</p>
  
              {/* Butonul pentru reply */}
              <div className="flex items-center mt-4 space-x-4">
                <button
                  type="button"
                  className="flex items-center text-sm text-gray-500 hover:underline dark:text-gray-400 font-medium"
                  onClick={() => setActiveReplyId(comment.comId)}
                >
                  <svg
                    className="mr-1.5 w-3.5 h-3.5"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 20 18"
                  >
                    <path
                      stroke="currentColor"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M5 5h5M5 8h2m6-3h2m-5 3h6m2-7H2a1 1 0 0 0-1 1v9a1 1 0 0 0 1 1h3v5l5-5h8a1 1 0 0 0 1-1V2a1 1 0 0 0-1-1Z"
                    />
                  </svg>
                  Reply
                </button>
              </div>
  
              {/* Formularul pentru reply */}
              {activeReplyId === comment.comId && (
                <form
                  className="ml-6 lg:ml-12 mt-4"
                  onSubmit={(e) => {
                    e.preventDefault();
                    handleReplyComment(comment.comId);
                  }}
                >
                  <div className="py-2 px-4 bg-white rounded-lg rounded-t-lg border border-gray-200 dark:bg-gray-800 dark:border-gray-700">
                    <textarea
                      className="px-0 w-full text-sm text-gray-900 border-0 focus:ring-0 focus:outline-none dark:text-white dark:placeholder-gray-400 dark:bg-gray-800"
                      rows="2"
                      placeholder="Write a reply..."
                      value={replyText}
                      onChange={(e) => setReplyText(e.target.value)}
                      required
                    />
                  </div>
                  <button
                    type="submit"
                    className="inline-flex items-center py-2.5 px-4 text-xs font-medium text-center text-white bg-primary rounded-lg focus:ring-4 focus:ring-primary-200 dark:focus:ring-primary-900 hover:bg-primary-800 mt-2"
                  >
                    Post reply
                  </button>
                </form>
              )}
  
              {/* Afișăm și reply-urile */}
              {comment.replies && Object.values(comment.replies).length > 0 && (
                <div className="">
                  {Object.values(comment.replies).map((reply, index) => (
                    <article key={index} className="p-6 pb-0 ml-6 lg:ml-12 text-base bg-white rounded-lg dark:bg-gray-900">
                      <footer className="flex justify-between items-center mb-2">
                        <div className="flex items-center">
                          <p className="inline-flex items-center mr-3 text-sm text-gray-900 dark:text-white font-semibold">
                            <img
                              className="mr-2 w-6 h-6 rounded-full"
                              src={reply.avatarUrl}
                              alt={reply.fullName}
                            />
                            {reply.fullName}
                          </p>
                          <p className="text-sm text-gray-600 dark:text-gray-400">
                            <time
                              pubdate
                              datetime={reply.timestamp?.toDate().toISOString()}
                              title={reply.timestamp?.toDate().toLocaleString()}
                            >
                              {reply.timestamp
                                ? formatDistanceToNow(new Date(reply.timestamp.seconds * 1000), { addSuffix: true })
                                : 'No timestamp'}
                            </time>
                          </p>
                        </div>
                      </footer>
                      <p className="text-gray-500 dark:text-gray-400">{reply.text}</p>
                    </article>
                  ))}
                </div>
              )}
            </article>
          ))}
        </div>
      </section>
    </div>
  );
}

export default Comments;
