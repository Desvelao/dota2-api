const api = require('./api.js')
const ui = require('./ui.js')

function main(){
  ui.menuDoAction().then(response => {
    switch (response.menuaction) {
      case 'Actualizar jugadores':
        api.updatePlayers()
        break;
      case 'Actualizar equipos':
        api.updateTeams()
        break;
      case 'Descargar liga':
        ui.menuParseLeague().then(res => {
          // api.checkLeague(9899)
          console.log('Parsing liga:',res.parseleague);
          api.checkLeague(res.parseleague,res.overwrite)
        })
        break;
      case 'Añadir jugador/a':
        ui.addPlayer().then(res => {
          // api.checkLeague(9899)
          console.log('Parsing',res.addplayer);
          api.get(api.playerURL(res.addplayer)).then(r => {
            if(r.error){return console.log('ERROR adding player')}
            api.addPlayer(r)
            console.log('Adding player:',r);
          })
        })
        break;
      case 'Añadir equipo':
        ui.addTeam().then(res => {
          // api.checkLeague(9899)
          console.log('Parsing',res.addteam);
          api.get(api.teamURL(res.addteam)).then(r => {
            if(r.error){return console.log('ERROR adding team')}
            api.addTeam(r).then(() => 'Team added',r.name,r.id).catch(err => console.log('Error adding team',r.name))
          })
        })
        // ui.menuParseLeague().then(res => {
        //   // api.checkLeague(9899)
        //   console.log('Parsing',res.parseleague);
        //   api.checkLeague(res.parseleague,true)
        // })
        break;
      default:
        api.updatePlayers()
    }
  })
}

main()

// api.checkLeague(9899)
// api.updatePlayers()
// let stay = true
//
// do {
//   console.log(`Acciones disponibles:
//     updateplayers - actualiza la información de los jugadores
//     `);
//
// } while (stay);
// api.get('https://api.opendota.com/api/players/112840925').then(response => {
//   console.log(response);
//   fs.addPlayer(response).then(() => console.log(`Registrado: ${response.profile.personaname}`))
// })

// api.get('https://api.stratz.com/api/v1/league/9899/matches?take=250').then(response => {
//   const matches = response.results
//   let newplayers = new Set()
//   matches.map(match => {
//     fs.addMatch(match,9899)
//     match.players.filter(player => player.steamId).map(player => newplayers.add(player.steamId))
//   })
//   if(newplayers.size){
//     // console.log(newplayers.values())
//     let urls = Array.from(newplayers).map(player => api.opendotaPlayerURL(player))
//     // console.log('URLS',urls);
//     api.multiple(urls, responses => {
//       // console.log('PLAYERSRESPONSES',responses.length);
//       responses.map(res => fs.addPlayer(res))
//     })
//   }
// })

process.on('unhandledRejection', (reason, p) => {
  console.log('Unhandled Rejection at',p,'reason',reason)
  // application specific logging, throwing an error, or other logic here
});
