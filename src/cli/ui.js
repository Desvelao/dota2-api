const inquirer = require('inquirer')

module.exports = {
  menuDoAction : () => {
    const questions = [{
      name : 'menuaction',
      type : 'list',
      message : 'Elige una opción',
      choices : ['Actualizar jugadores','Actualizar equipos','Descargar liga','Añadir jugador/a','Añadir equipo'],
      default : 'Actualizar jugadores'
    }]
    return inquirer.prompt(questions)
  },
  menuParseLeague : () => {
    const questions = [{
      name : 'parseleague',
      type : 'input',
      message : 'Introduce la id de la liga a parsear',
      validate : (input) => {
        // console.log('INNER VALIDATE');
        const leagueID = parseInt(input)
        // console.log('number',!isNaN(leagueID));
        return (!isNaN(leagueID)) ? true : 'Introduce la id válida de la liga a parsear.\nVe a https://www.dotabuff.com/ para conseguir la id de la liga'
      }
    },{
      name : 'overwrite',
      type : 'confirm',
      message : 'Sobreescribir los datos que puedan existir?',
      default : false
    }]
    return inquirer.prompt(questions)
  },
  addPlayer : () => {
    const questions = [{
      name : 'addplayer',
      type : 'input',
      message : 'DotaID del jugador/a a añadir',
      validate : (input) => {
        // console.log('INNER VALIDATE');
        const num = parseInt(input)
        // console.log('number',!isNaN(leagueID));
        return (!isNaN(num)) ? true : 'Introduce la dotaID válida del jugador.\nVe a https://www.dotabuff.com/ para conseguir la id del jugador.'
      }
    }]
    return inquirer.prompt(questions)
  },
  addTeam : () => {
    const questions = [{
      name : 'addteam',
      type : 'input',
      message : 'ID del equipo',
      validate : (input) => {
        // console.log('INNER VALIDATE');
        const num = parseInt(input)
        // console.log('number',!isNaN(leagueID));
        return (!isNaN(num)) ? true : 'Introduce la dotaID válida del equipo.\nVe a https://www.dotabuff.com/ para conseguir la id del equipo.'
      }
    }]
    return inquirer.prompt(questions)
  }
}
