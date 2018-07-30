const api = require('./api.js')
const { rt, db, fs, u } = require('./firebase.js')
const leagues = []

// const updatePlayers = setInterval(() => {api.updatePlayers()},api.ti_PLAYERS)
api.checkLeague(9978,true)

// db.collection('overview').doc('players').get().then(snap => {
//   if(!snap.exists){
//
//   }else{
//     console.log(snap.data());
//     rt.child('players').update(snap.data()).then(() => console.log('Update completed!'))
//   }
// })

// const followLeagues = setInterval(() => {
//   fs.followLeagues().then(snap => {
//     console.log(snap.val());
//     if(!snap.exists()){
//       console.log('Leagues follow doesnt exist');
//     }else{
//       const leagues = u.keysToArray(snap.val()).map(league => parseInt(league))
//       leagues.map(league => api.checkLeague(league))
//     }
//   })
// },api.ti_LEAGUES)
// })

// console.log(typeof fs.followLeagues);
