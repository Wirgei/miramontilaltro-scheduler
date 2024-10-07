import moment from 'moment';
moment.locale('it');
import * as db from './db';
import { smpt } from './config';
import nodemailer, { TransportOptions } from 'nodemailer';
import * as XLSX from 'xlsx';

// Import tasks
import taskMailWineConsumption from './taskMailWineConsumption'
import taskUpdateSomellierStock from './taskUpdateSomellierStock';

// Hard code mail receivers
// const CANTINA = ['alberto@plannervision.it'];
const CANTINA = ['mauro@miramontilaltro.it', 'alberto@miramontilaltro.it'];

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

// Utility functions
export async function sendEmail(to: string[], subject: string, body: string, attachments: any[] = []) {

  let playload = {
    from: '"alberto@miramontilaltro.it" <alberto@miramontilaltro.it>',
    to: to.join(', '),
    subject,
    html: body,
    attachments,
  };
  let transporter = nodemailer.createTransport(smpt as TransportOptions);

  try {
    return await transporter.sendMail(playload);
  } catch (error) {
    console.log(error);
    throw error;
  }
}

async function pause(timeout: number) {
  return new Promise<void>((resolve) => {
    setTimeout(() => {
      resolve();
    }, timeout);
  })
}

export async function xmls(data: any[][], filePath: string, cols?: any, margins?: any) {
  const workbook = XLSX.utils.book_new();
  const worksheet = XLSX.utils.aoa_to_sheet(data);
  if (!!cols) worksheet['!cols'] = cols;
  if (!!margins) worksheet['!margins'] = margins;
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Foglio1');
  XLSX.writeFile(workbook, filePath);
}