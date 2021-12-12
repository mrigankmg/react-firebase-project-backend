const functions = require("firebase-functions")
const admin = require('firebase-admin')
admin.initializeApp(functions.config().firebase)

exports.addPlayerRecord = functions.https.onCall((data, context) => {
    const auth = context.auth
    if (!auth) {
        throw new functions.https.HttpsError(
            'unauthenticated',
            'Only authenticated users can create user records.'
        )
    }
    const name = data.name
    if (!name) {
        throw new functions.https.HttpsError(
            'invalid-argument',
            'Missing argument.'
        )
    }
    const docRef = admin.firestore().collection('players').doc(auth.uid)
    return docRef.get().then(doc => {
        if (doc.exists) {
            throw new functions.https.HttpsError(
                'uid-already-exists',
                'This user already has a player record.'
            )
        }
        return docRef.set({
            name,
            colour: '',
            photoDownloadUrl: '',
            createdAt: admin.firestore.FieldValue.serverTimestamp()
        })
    })
})

exports.changeColour = functions.https.onCall((data, context) => {
    const auth = context.auth
    if (!auth) {
        throw new functions.https.HttpsError(
            'unauthenticated',
            'Only authenticated users can modify colours.'
        )
    }
    const colour = data.colour
    if (!colour) {
        throw new functions.https.HttpsError(
            'invalid-argument',
            'Missing argument.'
        )
    }
    const collectionRef = admin.firestore().collection('players')
    return collectionRef.where('colour', '==', colour).get()
        .then(snapshot => {
            if (!snapshot.empty) {
                snapshot.forEach(doc => {
                    if (doc.id !== auth.uid) {
                        throw new functions.https.HttpsError(
                            'invalid-argument',
                            'Another player has already taken that colour.'
                        )
                    }
                })
            }
            return collectionRef.doc(auth.uid).update({ colour })
        })
})

exports.updatePhotoDownloadUrl = functions.https.onCall((data, context) => {
    const auth = context.auth
    if (!auth) {
        throw new functions.https.HttpsError(
            'unauthenticated',
            'Only authenticated users can modify pictures.'
        )
    }
    const url = data.url
    if (!url) {
        throw new functions.https.HttpsError(
            'invalid-argument',
            'Missing argument.'
        )
    }
    return admin.firestore().collection('players').doc(auth.uid)
        .update({
            photoDownloadUrl: url
        })
})
