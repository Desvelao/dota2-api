const https = require('https')
const http = require('http')
const { db, fs, rt } = require('./firebase.js')
// console.log(typeof fs.getLeagueByID,fs);
let api = {}

api.get = (url) => {
  let request
  if(url.startsWith('https')){
    request = https
  }else if(url.startsWith('http')){
    request = http
  }
  return new Promise((resolve, reject) => {
    request.get(url, response => {
      if (response.statusCode < 200 || response.statusCode > 299) {
        // return new Error(`Failed to load page, status code: ${response.statusCode}\nURL: ${url}`)
        reject(new Error(`Failed to load page, status code: ${response.statusCode}\nURL: ${url}`));
      }
      // temporary data holder
      let chunks = '';
      // on every content chunk, push it to the data array
      response.on('data', (chunk) => {chunks += chunk});
      // we are done, resolve promise with those joined chunks
      response.on('end', () => {
        // console.log('end');
        try{
          resolve(JSON.parse(chunks));
        }catch(err){
          console.log(err);
          reject(`Error to JSON.parse the request to "${url}"\n${err}`)
        }
        // resolve(JSON.parse(chunks));
      });
    }).on('error', (err) => reject(err)).end();
    // // handle connection errors of the request
    // request
    // request
  })
}

api.RATE_LIMIT = 1000

api.multiple = (urls,callback,responses) => {
  responses = responses || []
  // console.log(responses);
  const url = urls.shift()
  api.get(url).then(data => {
    responses.push(data)
    console.log('Done request:',url);
    if(!urls.length){return callback(responses)}
    setTimeout(() => {
      api.multiple(urls,callback,responses)
    },api.RATE_LIMIT)
  })
}

api.playerURL = (id) => `https://api.opendota.com/api/players/${id}`

// api.leagueURL = (league,skip) => `https://api.stratz.com/api/v1/league/${league}/matches?take=250&skip=${skip}`
api.leagueURL = (league,skip) => `https://api.stratz.com/api/v1/league/${league}/matches?include=Series,PickBan&take=250&skip=${skip}`

api.leagueURLInfo = (league) => `https://api.stratz.com/api/v1/league/${league}`

api.teamURL = (team) => `https://api.stratz.com/api/v1/Team/${team}`

const hoursToTs = (hours) => hours*60*60*1000

api.LEAGUE_SKIP = 250
api.ti_LEAGUES = hoursToTs(1)
api.ti_PLAYERS = 10*1000//hoursToTs(1)

api.checkLeague = (league,overwrite) => {
  fs.getOverview().then(overview => {
    // console.log('overview',overview);
    let recursive = !overwrite ? {players : fs.keysToArray(overview.players), matches : fs.keysToArray(overview.matches), teams : fs.keysToArray(overview.teams)} : { players : [] , matches : [], teams : []}
    api.addInfoLeague(league,recursive,0)
    if(!overview.teams[league+'']){fs.addLeagueToOverview(league)}
  }).catch(err => console.log('error getOverview',err))
}

api.addInfoLeague = (league,recursive,skip) => {
  // console.log(league,recursive,skip);
  skip = skip || 0
  api.get(api.leagueURL(league,skip)).then(response => {
    const matches = response.results
    if(!matches.length){return}
    if(skip === 0){
      api.get(api.leagueURLInfo(league)).then(res => {
        api.addLeague(league,res).then(() => console.log('League info added')).catch(err => 'console.log(Error adding league info',err))
      })
    }
    // fs.infoLeague(response)
    let newplayers = new Set()
    let newteams = new Set()
    matches.map(match => {
      if(!recursive.matches.includes(match.id+'')){
        api.addMatch(match,league).then(() => console.log('Match added:',match.id+'')).catch(err => console.log('Error adding match',match.id))
        match.players.filter(player => player.steamId).map(player => newplayers.add(player.steamId))
        recursive.matches.push(match.id)
      }else{
        // console.log('Match in db:',match.id);
      }
      if(match.radiantTeam.id && !recursive.teams.includes(match.radiantTeam.id)){newteams.add(match.radiantTeam.id)}
      if(match.direTeam.id && !recursive.teams.includes(match.direTeam.id)){newteams.add(match.direTeam.id)}
    })
    if(newplayers.size){
      // console.log(newplayers.values())
      let urls = Array.from(newplayers).map(player => api.playerURL(player))
      // console.log('URLS',urls);
      if(urls.length){
        api.multiple(urls, responses => {
          // console.log('PLAYERSRESPONSES',responses.length);
          responses.map(res => {
            if(!recursive.players.includes(res.profile.account_id+'')){
              api.addPlayer(res).then(() => console.log('Player added:',res.profile.account_id)).catch(err => console.log('Error adding player',res.profile.account_id,err))
              recursive.players.push(res.profile.account_id+'')
            }else{
              // console.log('Player in db:',res.profile.account_id);
            }
          }
        )
        })
      }
    }
    if(newteams.size){
      // console.log(newplayers.values())
      let urls = Array.from(newteams).map(team => api.teamURL(team))
      // console.log('URLS',urls);
      if(urls.length){
        api.multiple(urls, responses => {
          // console.log('PLAYERSRESPONSES',responses.length);
          responses.map(res => {
            if(!recursive.teams.includes(res.id)){
              api.addTeam(res).then(() => console.log('Team added:',res.id)).catch(err => console.log('Error adding team',res.id,err))
              recursive.teams.push(res.id)
            }else{
              // console.log('Player in db:',res.profile.account_id);
            }
          }
        )
        })
      }
    }
    if(response.totals > skip + api.LEAGUE_SKIP){api.addInfoLeague(league,recursive,skip + api.LEAGUE_SKIP)}
  })
}

api.addPlayer = (data) => {
  // console.log('ACCOUNTID',data.profile);
  // if(data.profile.personaname === 'Desvelao^^'){console.log(data)}
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

api.addMatch = (data,league) => {
  let set = {
    radiant_win : data.didRadiantWin,
    radiant_team : data.radiantTeam.id,
    dire_team : data.direTeam.id,
    radiant_kills : data.radiantKills,
    dire_kills : data.radiantKills,
    duration : data.duration,
    series : data.series && data.series.matches && data.series.matches.length ? {id : data.series.id, matches : data.series.matches.map(match => match.id)} : {id : 0, matches : []},
    pick_bans : data.pickBans.length ? data.pickBans.map(pb => ({order: pb.order, pick : pb.isPick, hero : pb.heroId, radiant : pb.isRadiant, player : pb.playerIndex})) : [],
    first_blood : data.firstBloodTime,
    end : data.endDate,
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

api.addLeague = (league,data) => {
  return Promise.all([
    db.collection('leagues').doc(league+'').update({name : data.name, prizepool : data.basePrizePool || 0, image : `https://riki.dotabuff.com/leagues/${league}/banner.png`, start : data.startDate || 0, end : data.endDate || 0, lastmatch_date : data.lastMatchDate || 0}),
    rt.child('matches').update({[league+''] : true})
  ])
}

api.addTeam = (team) => {
  return Promise.all([
    db.collection('teams').doc(team.id+'').set({name : team.name, tag : nullifierString(team.tag), country_code : nullifierString(team.countryCode), logo : nullifierString(team.logo)}),
    rt.child('teams').update({[team.id+''] : true})
  ])
}

api.updatePlayers = () => {
  fs.getPlayersOverview().then(players => {
    console.log(players);
    const urls = players.map(player => api.playerURL(player))//.slice(0,2)
    // console.log(urls);
    api.multiple(urls, data => {
      console.log('Updating players...');
      Promise.all(data.map(d => api.addPlayer(d))).then(() => console.log(`${data.length} > Players updated!`)).catch(err => console.log('Error updating players',err))
    })
  })
}

api.updateTeams = () => {
  fs.getTeamsOverview().then(teams => {
    const urls = teams.map(team => api.teamURL(team))//.slice(0,2)
    // console.log(urls);
    api.multiple(urls, data => {
      console.log('Updating teams...');
      Promise.all(data.map(d => api.addTeam(d))).then(() => console.log(`${data.length} > Teams updated!`)).catch(err => console.log('Error updating teams',err))
    })
  })
}

const nullifier = (input) => {
  const value = [undefined,null].includes(input) ? 0 : input
  return value
}

const nullifierString = (input) => {
  const value = [undefined,null].includes(input) ? '' : input
  return value
}

module.exports = api
