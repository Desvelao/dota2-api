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
      rt.child('matches').once('value')
    ]
    Promise.all(promises).then(data => {
      // console.log('DATA',data.length,data);
      if(data[0].exists() && data[1].exists()){resolve({players : data[0].val(), matches : data[1].val()})}else{reject({players_exists : data[0].exists() , matches_exists : data[1].exists()})}
    }).catch(err => {console.log(err);reject(err)})
  })
}


fs.addPlayer = (data) => {
  // console.log('ACCOUNTID',data.profile);
  const promises = [
    db.collection('players').doc(data.profile.account_id.toString()).set({
      name : data.profile.personaname,
      avatar : data.profile.avatarfull,
      rank : nullifier(data.rank_tier),
      ranklb : nullifier(data.leaderboard_rank),
      url : data.profile.profileurl}),
    rt.child('players').update({[data.profile.account_id.toString()] : true})
  ]
  return Promise.all(promises)
}

fs.addMatch = (data,league) => {
  let set = {
    radiant_win : data.didRadiantWin,
    radiant_team : data.radiantTeam.id,
    dire_team : data.direTeam.id,
    radiant_kills : data.radiantKills,
    dire_kills : data.radiantKills,
    players : data.players.map(player => ({
      id : nullifier(player.steamId),
      slot : player.slot,
      hero : player.hero,
      kills : player.numKills,
      deaths : player.numDeaths,
      assists : player.numAssists,
      lasthits : player.numLastHits,
      denies : player.numDenies,
      gpm : player.goldPerMinute,
      xpm : player.expPerMinute,
      hero_damage : player.heroDamage,
      tower_damage : player.towerDamage,
      hero_healing : player.heroHealing,
      level : player.level,
      item0: nullifier(player.item0),
      item1: nullifier(player.item1),
      item2: nullifier(player.item2),
      item3: nullifier(player.item3),
      item4: nullifier(player.item4),
      item5: nullifier(player.item5),
      backPack1: nullifier(player.backPack1),
      backPack2: nullifier(player.backPack2),
      backPack3: nullifier(player.backPack3),
      lane: player.lane,
    }))
  }
  const promises = [
    db.collection('leagues').doc(league+'').collection('matches').doc(data.id.toString()).set(set),
    rt.child('matches').update({[data.id.toString()] : parseInt(league)})
  ]
  // console.log(set);
  return Promise.all(promises)
}

fs.addLeague = (league,data) => db.collection('leagues').doc(league+'').update({name : data.name, prizepool : data.basePrizePool, start : data.startDate, end : data.endDate})

fs.getLeagueByID = (league) => db.collection('leagues').doc(league.toString()).get()
fs.addLeagueToOverview = (league) => rt.child('leagues').update({[league.toString()] : true})

fs.rtval = (path) => rt.child(path).once('value')

fs.followLeagues = () => fs.rtval('leagues_follow')

fs.getPlayersOverview = (raw) => new Promise((resolve, reject) => {
  rt.child('players').once('value').then(snap => {
    if(snap.exists()){resolve(!raw ? fs.keysToArray(snap.val()) : snap.val())}else{reject('Not exists:','overview/players')}
  }).catch(err => reject(err))
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
