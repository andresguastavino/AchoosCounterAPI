const functions = require('firebase-functions');
const admin = require('firebase-admin');

var serviceAccount = require('./permissions.json');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: 'https://achooscounter.firebaseio.com'
});

const express = require('express');
const cors = require('cors');
const app = express();
app.use(cors({origin: true}));

const db = admin.firestore();

// Routes
// GET
app.get('/api/users/:user_id', (req, res) => {
    (async () => {
        try {
            const document = db.collection('users').doc(req.params.user_id); 
            let user = await document.get();
            let userData = user.data();

            return res.status(200).send(userData);
        } catch(error) {
            console.log(error);

            let response = {
                "statusCode": 500,
                "message": "Something went wrong: " + error
            };

            return res.status(500).send(response);
        }
    })();
});

// POST
app.post('/api/new_user', (req, res) => {
    (async () => {
        try {
            let query = db.collection('users');

            let userId = await query.get().then(querySnapshot => {
                let docs = querySnapshot.docs;
                return (docs.length > 0) ? (docs.length + 1) : (1);
            });

            await db.collection('users').doc('/' + userId + '/').create({});

            let response = {
                "status": 'SUCCESS',
                "statusCode": 201,
                "user_id": userId
            };

            return res.status(201).send(response);
        } catch(error) {
            console.log(error);

            let response = {
                "statusCode": 500,
                "message": "Something went wrong: " + error
            };

            return res.status(500).send(response);
        }
    })();
});
// PUT
app.put('/api/users/:user_id', (req, res) => {
    (async () => {
        try {
            const document = db.collection('users').doc(req.params.user_id);

            let response;
            if(req.body.new_entries !== undefined) {
                let new_entries = {};

                for(let entry of req.body.new_entries) {
                    let key = parseInt((entry.date).replace(/\//g, ''));
    
                    new_entries[key] = {
                        date: entry.date, 
                        achoos: entry.achoos
                    };
                }
    
                await document.update(new_entries);
    
                response = {
                    "status": 'SUCCESS',
                    "statusCode": 201,
                    new_entries
                };
            } else if(req.body.date !== undefined && req.body.achoos !== undefined) {
                let new_entry = {};

                let key = parseInt((req.body.date).replace(/\//g, ''));
    
                new_entry[key] = {
                    date: req.body.date, 
                    achoos: req.body.achoos
                };
                
                await document.update(new_entry);

                response = {
                    "status": 'SUCCESS',
                    "statusCode": 201,
                    new_entry
                };
            }

            return res.status(201).send(response);
        } catch(error) {
            console.log(error);

            let response = {
                "status": 500,
                "message": "Something went wrong: " + error
            };

            return res.status(500).send(response);
        }
    })();
});

// DELETE 
app.delete('/api/users/:user_id', (req, res) => {
    (async () => {
        try {
            const document = db.collection('users').doc(req.params.user_id);

            await document.delete();

            let response = {
                "status": 'SUCCESS',
                "statusCode": 201,
            };

            return res.status(201).send(response);
        } catch(error) {
            console.log(error);

            let response = {
                "status": 500,
                "message": "Something went wrong: " + error
            };

            return res.status(500).send(response);
        }
    })();
});

// Export API to Firebase Cloud Functions
exports.app = functions.https.onRequest(app);

