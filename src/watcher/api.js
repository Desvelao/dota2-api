const https = require('https')
const http = require('http')
const { fs } = require('./firebase.js')
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

api.leagueURL = (league,skip) => `https://api.stratz.com/api/v1/league/${league}/matches?take=250&skip=${skip}`

const hoursToTs = (hours) => hours*60*60*1000

api.LEAGUE_SKIP = 250
api.ti_LEAGUES = hoursToTs(1)
api.ti_PLAYERS = 10*1000//hoursToTs(1)


api.checkLeague = (league,overwrite) => {
  fs.getLeagueByID(league).then(snap => {
    return console.log('LEAGUE',league,snap.exists);
    if(!snap.exists){ //!snap.exists
      console.log(`League dont exists`);
      // return console.log('No exists league:',league); //TODO add fields info about league and matches
      fs.getOverview().then(overview => {
        // console.log('overview',overview);
        let recursive = !overwrite ? {players : fs.keysToArray(overview.players), matches : fs.keysToArray(overview.matches)} : { players : [] , matches : []}
        // return console.log(recursive);
        api.addLeague(league,recursive,0)
        fs.addLeagueToOverview(league)
      }).catch(err => console.log('error getOverview',err))
    }else{
      console.log('Exists:',league);//TODO update league
      fs.getOverview().then(overview => {
        // console.log('overview',overview);
        let recursive = !overwrite ? {players : fs.keysToArray(overview.players), matches : fs.keysToArray(overview.matches)} : { players : [] , matches : []}
        // return console.log(recursive);
        api.addLeague(league,recursive,0)

      }).catch(err => console.log('error getOverview',err))
    }
  })
}

api.addLeague = (league,recursive,skip) => {
  console.log(league,recursive,skip);
  skip = skip || 0
  api.get(api.leagueURL(league,skip)).then(response => {
    const matches = response.results
    if(!matches.length){return}
    // fs.infoLeague(response)
    let newplayers = new Set()
    matches.map(match => {
      if(!recursive.matches.includes(match.id+'')){
        fs.addMatch(match,league)
        match.players.filter(player => player.steamId).map(player => newplayers.add(player.steamId))
        recursive.matches.push(match.id)
        console.log('Match added:',match.id+'');
      }else{
        // console.log('Match in db:',match.id);
      }
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
              fs.addPlayer(res)
              recursive.players.push(res.profile.account_id+'')
              console.log('Player added:',res.profile.account_id);
            }else{
              // console.log('Player in db:',res.profile.account_id);
            }
          }
        )
        })
      }
    }
    if(response.totals > skip + api.LEAGUE_SKIP){api.addLeague(league,recursive,skip + api.LEAGUE_SKIP)}
  })
}

api.updatePlayers = () => {
  fs.getPlayersOverview().then(players => {
    // console.log(players);
    const urls = players.map(player => api.playerURL(player))//.slice(0,2)
    console.log(urls);
    api.multiple(urls, data => {
      console.log('Updating players');
      data.map(d => fs.addPlayer(d))
      console.log(`${data.length} > Players updated!`);
    })
  })
}

module.exports = api
