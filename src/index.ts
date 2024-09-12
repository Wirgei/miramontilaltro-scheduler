import * as db from './db';
import { smpt } from './config';
import nodemailer from 'nodemailer';
import * as XLSX from 'xlsx';
import * as os from 'os';
import * as path from 'path';

// const EMAIL_XFARMA = ['wirgei@gmail.com', 'massi@xfarma.it'];
// const EMAIL_SUPPLIERS = ['alberto@plannervision.com', 'massi@xfarma.it', 'lorenzo.lazzarini@aesculapius.it'];


// Hard code mail receivers
const EMAIL_DEVELOPER = ['alberto@plannervision.it'];

const CANTINA = ['mauro@miramontilaltro.it'];







main();

async function main() {

  let ArgumentsArray = [];

  for (let index = 2; index < process.argv.length; index++) {
    ArgumentsArray.push(process.argv[index].toUpperCase());
  }

  try {

    let tasks = {

      wineStats: async (intestazione: string, emailsTo: string[]) => {
        const WORKSHEET_COLS = [
          { wch: 2.5 },
          { wch: 50 },
          { wch: 7 },
          { wch: 7 },
          { wch: 7 },
          { wch: 10 },
        ];

        const WORKSHEET_MARGIN = { left: 0.0, right: 0.0, top: 0.0, bottom: 0.0, header: 0.0, footer: 0.0 };

        let [rows, fields] = await db.query(`              
          SELECT sum(cp.Quantità) AS qta
          , concat(v.produttore, ' ', v.descrizione) AS vino
          , v.annata
          , avg(cp.Prezzo) AS incasso
          , avg(cp.PrezzoListino) AS prezzo
          , group_concat(c.Tag) AS tags
          FROM cassa.tblConti c
          INNER JOIN cassa.tblContiPortate cp ON cp.FKConto = c.IDConto
          INNER JOIN cassa.tblMenùPortate mp ON mp.IDMenùPortate = cp.FKMenùPortate
          INNER JOIN cassa.tblMenù m ON m.IDMenù = mp.FKMenù
          INNER JOIN cassa.tblPortate p ON p.IDPortata = mp.FKPortate
          INNER JOIN cassa.tblPortateCategorie pc ON pc.IDPortateCategoria = p.FKPortateCategorie
          INNER JOIN cassa.carta_dei_vini v ON v.id = cp.FKEsterno

          WHERE c.DataStampa = CURRENT_DATE() - INTERVAL 1 DAY
            AND pc.Nome = 'Vini'
            AND cp.FKEsterno IS NOT null
            
          GROUP BY concat(v.produttore, ' ', v.descrizione)
          , v.annata

          ORDER BY cp.NomePortateFinale
          `
        );

        if (!(rows instanceof Array)) throw new Error('Rows isn\'t an array');

        if (rows.length === 0) {
          await sendEmail(['alberto@plannervision.com'], 'Vini da verificare', `<p>Spettabile ${intestazione},</p><p>Non ci sono dati da verificare.</p>`);
          console.log('No data to send');
          return;
        }

        let newData = [];

        let yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);

        newData.push(['', new Date().toLocaleDateString('it-IT')]);

        let header = [];
        for (let field of fields) {
          header.push(field.name);
        }
        newData.push(header);

        for (let row of rows) {
          newData.push(Object.values(row));
        }

        let tmpDir = os.tmpdir();
        let filePath = path.join(tmpDir, 'elencoDaControllare.xlsx');
        // let filePath = 'dati.xlsx';

        await xmls(newData, filePath, WORKSHEET_COLS, WORKSHEET_MARGIN);

        await sendEmail(
          ['alberto@plannervision.com'],
          'Vini da verificare',
          `<p>Spettabile ${intestazione},</p><p>in allegato i dati richiesti.</p>`,
          [{ path: filePath }]
        );
      },
    }

    for (let arg of ArgumentsArray) {

      switch (arg.toUpperCase()) {

        case 'CANTINA':
          await tasks.wineStats('Maurizio Piscini', EMAIL_DEVELOPER);
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



async function sendEmail(to: string[], subject: string, body: string, attachments: any[] = []) {

  let playload = {
    from: '"alberto@miramontilaltro.it" <alberto@miramontilaltro.it>',
    to: to.join(', '),
    subject,
    html: body,
    attachments,
  };
  let transporter = nodemailer.createTransport(smpt);

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

async function xmls(data: any[][], filePath: string, cols?: any, margins?: any) {
  const workbook = XLSX.utils.book_new();
  const worksheet = XLSX.utils.aoa_to_sheet(data);
  if (!!cols) worksheet['!cols'] = cols;
  if (!!margins) worksheet['!margins'] = margins;
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Foglio1');
  XLSX.writeFile(workbook, filePath);
}