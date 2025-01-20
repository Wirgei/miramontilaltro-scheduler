import moment from 'moment';
moment.locale('it');
import * as db from './db';


// Import tasks
import taskMailWineConsumption from './taskMailWineConsumption'
import taskUpdateSomellierStock from './taskUpdateSomellierStock';
import { pause } from './utils';

const CANTINA = ['mauro@miramontilaltro.it', 'simofrance003.14@gmail.com'];

main();

async function main() {

  let ArgumentsArray = [];

  for (let index = 2; index < process.argv.length; index++) {
    ArgumentsArray.push(process.argv[index].toUpperCase());
  }

  try {

    for (let arg of ArgumentsArray) {

      switch (arg.toUpperCase()) {

        case 'CANTINA':
          await taskMailWineConsumption('Miramonti l\'altro', CANTINA);
          break;

        case 'AGGIORNA_GIANCEZE_SOMMELIER':
          await taskUpdateSomellierStock();
          break;

        default:
          break;
      }

      await pause(1000);
    }

  }
  catch (err) {
    console.log(err);
  }
  finally {
    db.end();
  }
}


