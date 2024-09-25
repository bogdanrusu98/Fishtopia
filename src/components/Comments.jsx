import React, { useEffect, useState } from 'react';
import { CommentSection } from 'react-comments-section';
import 'react-comments-section/dist/index.css';
import { collection, getDocs, getDoc, addDoc, query, where, deleteDoc, doc, updateDoc, arrayUnion } from 'firebase/firestore';
import { db } from '../firebase.config';
import { useUser } from '../hooks/userContext';
import { useParams } from 'react-router-dom';
import { toast } from 'react-toastify';

function Comments() {
  const { listingId } = useParams(); // Extragem listingId din URL
  const [comments, setComments] = useState([]);
  const user = useUser()


  // Funcția pentru a prelua comentariile pentru acest listing
  const fetchComments = async (listingId) => {
    const q = query(collection(db, "comments"), where("listingRef", "==", listingId));
    const querySnapshot = await getDocs(q);
    const commentList = querySnapshot.docs.map(doc => ({ ...doc.data(), comId: doc.id }));
    setComments(commentList);
  };

  useEffect(() => {
    if (listingId) {
      fetchComments(listingId); // Preluăm comentariile doar dacă listingId este disponibil
    }
  }, [listingId]);

  // Funcția pentru a adăuga comentarii pentru acest listing
  const handleAddComment = async (newComment) => {
    await addDoc(collection(db, 'comments'), {
      userId: newComment.userId,
      fullName: newComment.fullName,
      avatarUrl: user.photoURL ? user.photoURL : "https://flowbite.com/docs/images/people/profile-picture-5.jpg",
      text: newComment.text,
      replies: [],
      listingRef: listingId // Adăugăm listingId la comentariu
    });

    fetchComments(listingId); // Reîncărcăm comentariile pentru acest listing
  };

  const handleUpdateComment = async ({ comId, parentOfEditedCommentId, text }) => {
    console.log(comId)
    console.log(text)

    // Dacă este un comentariu de top-level
    const commentRef = doc(db, 'comments', comId);
    await updateDoc(commentRef, { text: text });
    toast.success('Comment edited')
  };

  const handleDeleteComment = async ({ comIdToDelete, parentOfDeleteId }) => {
    try {
      if (parentOfDeleteId) {
        // Dacă este un răspuns la alt comentariu
        const parentCommentRef = doc(db, 'comments', parentOfDeleteId);
        const parentCommentSnapshot = await getDoc(parentCommentRef);

        if (parentCommentSnapshot.exists()) {
          const parentCommentData = parentCommentSnapshot.data();
          const updatedReplies = parentCommentData.replies.filter(reply => reply.comId !== comIdToDelete);

          await updateDoc(parentCommentRef, { replies: updatedReplies });
          console.log('Reply deleted successfully');
        } else {
          console.error('Parent comment not found');
        }
      } else {
        // Dacă este un comentariu de top-level
        const commentRef = doc(db, 'comments', comIdToDelete);
        await deleteDoc(commentRef);
        toast.success('Comment deleted successfully');
      }

      fetchComments(listingId); // Actualizează comentariile după ștergere
    } catch (error) {
      console.error("Error deleting comment:", error);
    }
  };

  const handleReplyComment = async ({ text, repliedToCommentId, userId, fullName, avatarUrl, parentOfRepliedCommentId }) => {
    try {
      if (!parentOfRepliedCommentId) {
      const commentRef = doc(db, "comments", repliedToCommentId);
      await updateDoc(commentRef, {
        replies: arrayUnion({
          text,
          timestamp: new Date(),
          userId,
          fullName: fullName,
          avatarUrl: avatarUrl
        })
      });
      console.log("Reply adăugat cu succes!");
    } else {
      const commentRef = doc(db, "comments", parentOfRepliedCommentId);
      await updateDoc(commentRef, {
        replies: arrayUnion({
          text,
          timestamp: new Date(),
          userId,
          parentOfRepliedCommentId: user.uid,
          fullName: fullName,
          avatarUrl: avatarUrl
        })
      });
    }
    } catch (e) {
      console.error("Eroare la adăugarea reply-ului: ", e);
      console.log(parentOfRepliedCommentId)
    }
  };

  return (
    <div>
      <CommentSection
        currentUser={{
          currentUserId: user.uid,
          currentUserImg: user.photoURL ? user.photoURL : "https://flowbite.com/docs/images/people/profile-picture-5.jpg",
          currentUserProfile: 'https://www.linkedin.com/in/jane-doe',
          currentUserFullName: user.displayName
        }}
        logIn={{
          loginLink: '/sign-in',
          signupLink: '/sign-up'
        }}
        advancedInput={true}
        formStyle={{ backgroundColor: 'white' }}
        commentData={comments}
        onSubmitAction={(data) => handleAddComment(data)} // Adăugăm comentariul în Firestore
        onEditAction={(data) => handleUpdateComment(data)} // Edităm comentariul
        onDeleteAction={(data) => handleDeleteComment(data)}
        onReplyAction={(data) => handleReplyComment(data)}
      />

    </div>
  )
}

export default Comments