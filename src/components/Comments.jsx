import React, { useEffect, useState } from 'react';
import { collection, getDocs, addDoc, query, where, deleteDoc, doc, updateDoc, arrayUnion, serverTimestamp } from 'firebase/firestore';
import { db } from '../firebase.config';
import { useUser } from '../hooks/userContext';
import { useParams } from 'react-router-dom';
import { toast } from 'react-toastify';
import { formatDistanceToNow } from 'date-fns'; // Importăm funcția pentru a formata timpul

function Comments() {
  const { listingId } = useParams(); // Extragem listingId din URL
  const [comments, setComments] = useState([]);
  const [newCommentText, setNewCommentText] = useState(''); // Stare pentru textul comentariului
  const user = useUser();

  // Funcția pentru a prelua comentariile pentru acest listing
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

  useEffect(() => {
    if (listingId) {
      fetchComments(listingId); // Preluăm comentariile doar dacă listingId este disponibil
    }
  }, [listingId]);

  // Funcția pentru a adăuga comentarii pentru acest listing
  const handleAddComment = async (e) => {
    e.preventDefault(); // Prevenim comportamentul implicit al formularului

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
      listingRef: listingId, // Adăugăm listingId la comentariu
      timestamp: serverTimestamp(),
    };

    try {
      await addDoc(collection(db, 'comments'), newComment);
      setNewCommentText(''); // Resetăm textul comentariului după adăugare
      fetchComments(listingId); // Reîncărcăm comentariile după adăugare
      toast.success('Comment added successfully');
    } catch (error) {
      console.error('Error adding comment:', error);
      toast.error('Failed to add comment');
    }
  };

  const handleReplyComment = async ({ text, repliedToCommentId, userId, fullName, avatarUrl }) => {
    const commentRef = doc(db, "comments", repliedToCommentId);
    await updateDoc(commentRef, {
      replies: arrayUnion({
        text,
        timestamp: serverTimestamp(),
        userId,
        fullName,
        avatarUrl,
      }),
    });

    console.log("Reply adăugat cu succes!");
    fetchComments(listingId); // Reîncărcăm comentariile după reply
  };

  return (
    <div>
      <section className="bg-white dark:bg-gray-900 py-8 lg:py-16 antialiased">
        <div className="max-w-2xl mx-4 px-4">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-lg lg:text-2xl font-bold text-gray-900 dark:text-white">
              Discussion ({comments.length})
            </h2>
          </div>

          {/* Formularul pentru a adăuga comentarii */}
          <form className="mb-6" onSubmit={handleAddComment}>
            <div className="py-2 px-4 mb-4 bg-white rounded-lg rounded-t-lg border border-gray-200 dark:bg-gray-800 dark:border-gray-700">
              <label htmlFor="comment" className="sr-only">Your comment</label>
              <textarea
                id="comment"
                rows="6"
                className="px-0 w-full text-sm text-gray-900 border-0 focus:ring-0 focus:outline-none dark:text-white dark:placeholder-gray-400 dark:bg-gray-800"
                placeholder="Write a comment..."
                value={newCommentText} // Legăm textarea de stare
                onChange={(e) => setNewCommentText(e.target.value)} // Actualizăm starea cu textul introdus
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
            <article key={comment.comId} className="p-6 text-base bg-white rounded-lg dark:bg-gray-900">
              <footer className="flex justify-between items-center mb-2">
                <div className="flex items-center">
                  <p className="inline-flex items-center mr-3 text-sm text-gray-900 dark:text-white font-semibold">
                    <img
                      className="mr-2 w-6 h-6 rounded-full"
                      src={comment.avatarUrl}
                      alt={comment.fullName}
                    />
                    {comment.fullName}
                  </p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    <time pubdate datetime={comment.timestamp?.toDate().toISOString()} title={comment.timestamp?.toDate().toLocaleString()}>
                      {comment.timestampFormatted}
                    </time>
                  </p>
                </div>
              </footer>
              <p className="text-gray-500 dark:text-gray-400">{comment.text}</p>

              {/* Reply button */}
              <div className="flex items-center mt-4 space-x-4">
                <button
                  type="button"
                  className="flex items-center text-sm text-gray-500 hover:underline dark:text-gray-400 font-medium"
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

              {/* Afișăm și reply-urile */}
              {comment.replies && comment.replies.length > 0 && (
                <div className="ml-6 lg:ml-12 mt-4">
                  {comment.replies.map((reply, index) => (
                    <article key={index} className="p-6 mb-3 bg-white dark:bg-gray-900 rounded-lg">
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
                            <time pubdate datetime={reply.timestamp?.toDate().toISOString()} title={reply.timestamp?.toDate().toLocaleString()}>
                              {reply.timestamp ? formatDistanceToNow(new Date(reply.timestamp.seconds * 1000), { addSuffix: true }) : 'No timestamp'}
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
