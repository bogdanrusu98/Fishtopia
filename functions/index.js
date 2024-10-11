const functions = require('firebase-functions');
const admin = require('firebase-admin');
const algoliasearch = require('algoliasearch');

// Inițializează Firebase Admin SDK
admin.initializeApp();

// Inițializează clientul Algolia
const ALGOLIA_APP_ID = process.env.ALGOLIA_APP_ID;
const ALGOLIA_ADMIN_KEY = process.env.ALGOLIA_ADMIN_KEY;
const algoliaClient = algoliasearch(ALGOLIA_APP_ID, ALGOLIA_ADMIN_KEY);

// Creează indexurile pentru listings și users
const listingsIndex = algoliaClient.initIndex('listings');
const usersIndex = algoliaClient.initIndex('users');

// Funcție pentru a sincroniza documentele "listings" cu Algolia
exports.syncListingToAlgolia = functions.firestore.document('listings/{listingId}').onWrite(async (change, context) => {
    const listingId = context.params.listingId;

    if (!change.after.exists) {
        // Documentul a fost șters, elimină-l din Algolia
        await listingsIndex.deleteObject(listingId);
        return null;
    }

    // Documentul a fost adăugat sau actualizat
    const listingData = change.after.data();
    const algoliaRecord = {
        objectID: listingId, // Algolia necesită câmpul objectID
        ...listingData
    };

    // Adaugă sau actualizează documentul în Algolia
    await listingsIndex.saveObject(algoliaRecord);
    return null;
});

// Funcție pentru a sincroniza documentele "users" cu Algolia
exports.syncUserToAlgolia = functions.firestore.document('users/{userId}').onWrite(async (change, context) => {
    const userId = context.params.userId;

    if (!change.after.exists) {
        // Documentul a fost șters, elimină-l din Algolia
        await usersIndex.deleteObject(userId);
        return null;
    }

    // Documentul a fost adăugat sau actualizat
    const userData = change.after.data();
    const algoliaRecord = {
        objectID: userId, // Algolia necesită câmpul objectID
        ...userData
    };

    // Adaugă sau actualizează documentul în Algolia
    await usersIndex.saveObject(algoliaRecord);
    return null;
});
