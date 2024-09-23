import * as db from './db';
import { smpt } from './config';
import nodemailer, { TransportOptions } from 'nodemailer';
import * as XLSX from 'xlsx';
import * as os from 'os';
import * as path from 'path';

import moment from 'moment';
moment.locale('it');

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

    let tasks = {

      wineStats: async (intestazione: string, emailsTo: string[]) => {
        const WORKSHEET_COLS = [
          { wch: 2.5 },
          { wch: 62 },
          { wch: 7 },
          { wch: 7 },
          { wch: 10 },
        ];

        const WORKSHEET_MARGIN = { left: 0.0, right: 0.0, top: 0.0, bottom: 0.0, header: 0.0, footer: 0.0 };

        let selectedDay = moment().subtract(1, 'day');

        let [rows, fields] = await db.query(`              
          SELECT sum(cp.Quantità) AS qta
          , cp.NomePortateFinale AS descrizione
          , avg(cp.Prezzo) AS prezzo
          , avg(cp.PrezzoListino) AS listino
          , GROUP_CONCAT(c.Tag) AS tags

          FROM cassa.tblConti c
          INNER JOIN cassa.tblContiPortate cp ON cp.FKConto = c.IDConto
          LEFT JOIN cassa.tblMenùPortate mp ON mp.IDMenùPortate = cp.FKMenùPortate
          LEFT JOIN cassa.tblMenù m ON m.IDMenù = mp.FKMenù
          LEFT JOIN cassa.tblPortate p ON p.IDPortata = mp.FKPortate
          LEFT JOIN cassa.tblPortateCategorie pc ON pc.IDPortateCategoria = p.FKPortateCategorie

          WHERE c.DataStampa = '${selectedDay.format("YYYY-MM-DD")}'
          AND pc.Nome = 'Vini'
          AND cp.FKEsterno IS NOT null

          GROUP BY cp.NomePortateFinale
          , c.FKServizio

          UNION

          SELECT x.saldo_carichi * (-1) AS qta
          , x.descrizione
          , null AS prezzo
          , null AS listino
          , 'sommelier' AS tags
          FROM (

          SELECT s.DescrizioneVino AS descrizione
          , s.AnnataVino AS annata
          , SUM(IFNULL(s.BottCaricate,0)) AS serie_carichi
          , SUM(IFNULL(s.BottScaricate,0)) AS serie_scarichi

          , SUM(IFNULL(s.BottCaricate,0)) + SUM(IFNULL(s.BottScaricate,0)) AS saldo_carichi
          FROM cantina.tblViniStoricoSommelier s
          WHERE s.inserted >= CONCAT('${selectedDay.format("YYYY-MM-DD")}', ' 05:00:00') 
          AND s.inserted < CONCAT(DATE('${selectedDay.format("YYYY-MM-DD")}') + INTERVAL 1 DAY, ' 05:00:00')
          GROUP BY s.DescrizioneVino
          , s.AnnataVino

          HAVING SUM(IFNULL(s.BottCaricate,0)) + SUM(IFNULL(s.BottScaricate,0)) < 0
          ) AS x ;
          `
        );

        if (!(rows instanceof Array)) throw new Error('Rows isn\'t an array');

        if (rows.length === 0) {
          await sendEmail(['alberto@plannervision.com'], 'Vini da verificare', `<p>Spettabile ${intestazione},</p><p>Non ci sono dati da verificare.</p>`);
          console.log('No data to send');
          return;
        }

        let newData = [];

        newData.push(['', selectedDay.format('dddd, LL')]);

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

        await xmls(newData, filePath, WORKSHEET_COLS, WORKSHEET_MARGIN);

        await sendEmail(
          emailsTo,
          'Vini da verificare',
          `<p>Spettabile ${intestazione},</p><p>in allegato i dati richiesti.</p>`,
          [{ path: filePath }]
        );
      },
    }

    for (let arg of ArgumentsArray) {

      switch (arg.toUpperCase()) {

        case 'CANTINA':
          await tasks.wineStats('Miramonti l\'altro', CANTINA);
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

async function xmls(data: any[][], filePath: string, cols?: any, margins?: any) {
  const workbook = XLSX.utils.book_new();
  const worksheet = XLSX.utils.aoa_to_sheet(data);
  if (!!cols) worksheet['!cols'] = cols;
  if (!!margins) worksheet['!margins'] = margins;
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Foglio1');
  XLSX.writeFile(workbook, filePath);
}