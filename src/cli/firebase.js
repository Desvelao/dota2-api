const firebase = require('firebase-admin')
const serviceAccount = require('./firebasekey.json');

firebase.initializeApp({
  credential: firebase.credential.cert(serviceAccount),
  databaseURL: "https://dota2-api-es.firebaseio.com"
});

let db = firebase.firestore()
const rt = firebase.database().ref()

let fs = {}

fs.getOverview = () => {
  return new Promise((resolve,reject) => {
    const promises = [
      rt.child('players').once('value'),
      rt.child('matches').once('value'),
      rt.child('teams').once('value')
    ]
    Promise.all(promises).then(data => {
      // console.log('DATA',data.length,data);
      // console.log(data);
      resolve({
        players : data[0].exists() ? data[0].val() : [],
        matches :data[1].exists() ? data[1].val() : [],
        teams :data[2].exists() ? data[2].val() : []
      })
      // if(data[0].exists() && data[1].exists()){resolve({players : data[0].val(), matches : data[1].val()})}else{reject({players_exists : data[0].exists() , matches_exists : data[1].exists()})}
    }).catch(err => {console.log(err);reject(err)})
  })
}

fs.getLeagueByID = (league) => db.collection('leagues').doc(league.toString()).get()
fs.addLeagueToOverview = (league) => rt.child('leagues').update({[league.toString()] : true})

fs.rtval = (path) => rt.child(path).once('value')

fs.followLeagues = () => fs.rtval('leagues_follow')

fs.getPlayersOverview = (raw) => new Promise((resolve, reject) => {
  rt.child('players').once('value').then(snap => {
    if(snap.exists()){resolve(!raw ? fs.keysToArray(snap.val()) : snap.val())}else{reject('Not exists:','overview/players')}
  }).catch(err => reject(err))
})

fs.getTeamsOverview = (raw) => new Promise((resolve, reject) => {
  fs.rtval('teams').then(snap => {
    if(snap.exists()){resolve(!raw ? fs.keysToArray(snap.val()) : snap.val())}else{reject('Not exists:','overview/teams')}
  })
})

fs.keysToArray = (obj) => Object.keys(obj)

let u = {}

u.collection = (obj) => Object.keys(obj)
u.keysToArray = (obj) => Object.keys(obj)

const nullifier = (input) => {
  const value = [undefined,null].includes(input) ? 0 : input
  return value
}

module.exports = { firebase, db, rt, fs , u }
