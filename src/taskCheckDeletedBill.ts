import * as db from './db';
import * as os from 'os';
import * as path from 'path';
import { sendEmail, xmls } from './utils';


export default async function taskCheckDeletedBill(intestazione: string, emailsTo: string[]): 
Promise<void> {
  const WORKSHEET_COLS = [
    { wch: 7 },
    { wch: 12 },
    { wch: 20 },
    { wch: 7 },
    { wch: 7 },
    { wch: 7 },
    { wch: 7 },
    { wch: 7 },
    { wch: 7 },
    { wch: 7 },
    { wch: 7 },
    { wch: 7 },
  ];

  const FILENAME = 'taskCheckDeletedBill.xlsx';

  const WORKSHEET_MARGIN = { left: 0.0, right: 0.0, top: 0.0, bottom: 0.0, header: 0.0, footer: 0.0 };


  let [rows, fields] = await db.query<{ qta: number, descrizione: string, prezzo: number, listino: number, tags: string }>(`
    SELECT
    c.IDConto AS IDConto,
    DATE_FORMAT(c.DataStampa, '%d/%m/%Y') as data_servizio,
    DATE_FORMAT(c.Data, '%d/%m/%Y %H:%i') as data_ora,
    (SELECT s.Nome from tblServizio s WHERE s.IDServizio  = c.FKServizio) AS servizio,
    (SELECT t.Nome FROM tblTavoli t WHERE t.IDTavolo = c.FKTavolo) AS tavolo,
      (
      SELECT
        tblContiPortate.Quantità
      FROM
        (
          (
            tblMenùPortate
            JOIN tblContiPortate ON(
              tblMenùPortate.IDMenùPortate = tblContiPortate.FKMenùPortate
            )
          )
          JOIN tblPortate ON(
            tblMenùPortate.FKPortate = tblPortate.IDPortata
          )
        )
      WHERE
        tblContiPortate.FKConto = c.IDConto
        AND tblMenùPortate.FKPortate = 34
    ) AS coperti,
    c.Tag AS tag,
    CAST(
      (
        SELECT
          SUM(
            tblContiPortate.Prezzo * tblContiPortate.Quantità
          )
        FROM
          (
            (
              (
                (
                  tblMenùPortate
                  JOIN tblContiPortate ON(
                    tblMenùPortate.IDMenùPortate = tblContiPortate.FKMenùPortate
                  )
                )
                JOIN tblPortate ON(
                  tblMenùPortate.FKPortate = tblPortate.IDPortata
                )
              )
              JOIN tblPortateCategorie ON(
                tblPortate.FKPortateCategorie = tblPortateCategorie.IDPortateCategoria
              )
            )
            JOIN tblPortateCategorieStampa ON(
              tblPortateCategorie.FKPortateCategoriaStampa = tblPortateCategorieStampa.IDPortateCategorieStampa
            )
          )
        WHERE
          tblContiPortate.FKConto = c.IDConto
          AND tblPortateCategorieStampa.Nome IN (
            'Cucina', 'Cantina', 'Distillati',
            'Aperitivi', 'Caffè', 'Acqua'
          )
      ) - COALESCE(c.Sconto, 0) AS decimal(10, 2)
    ) AS fb,
    CAST(
      (
        SELECT
          SUM(
            tblContiPortate.Prezzo * tblContiPortate.Quantità
          )
        FROM
          (
            (
              (
                (
                  tblMenùPortate
                  JOIN tblContiPortate ON(
                    tblMenùPortate.IDMenùPortate = tblContiPortate.FKMenùPortate
                  )
                )
                JOIN tblPortate ON(
                  tblMenùPortate.FKPortate = tblPortate.IDPortata
                )
              )
              JOIN tblPortateCategorie ON(
                tblPortate.FKPortateCategorie = tblPortateCategorie.IDPortateCategoria
              )
            )
            JOIN tblPortateCategorieStampa ON(
              tblPortateCategorie.FKPortateCategoriaStampa = tblPortateCategorieStampa.IDPortateCategorieStampa
            )
          )
        WHERE
          tblContiPortate.FKConto = c.IDConto
          AND tblPortateCategorieStampa.Nome = 'Altro No Food'
      ) AS decimal(10, 2)
    ) AS altro,
    CAST(
      (
        SELECT
          SUM(
            tblContiPortate.Prezzo * tblContiPortate.Quantità
          )
        FROM
          (
            (
              (
                (
                  tblMenùPortate
                  JOIN tblContiPortate ON(
                    tblMenùPortate.IDMenùPortate = tblContiPortate.FKMenùPortate
                  )
                )
                JOIN tblPortate ON(
                  tblMenùPortate.FKPortate = tblPortate.IDPortata
                )
              )
              JOIN tblPortateCategorie ON(
                tblPortate.FKPortateCategorie = tblPortateCategorie.IDPortateCategoria
              )
            )
            JOIN tblPortateCategorieStampa ON(
              tblPortateCategorie.FKPortateCategoriaStampa = tblPortateCategorieStampa.IDPortateCategorieStampa
            )
          )
        WHERE
          tblContiPortate.FKConto = c.IDConto
          AND tblPortateCategorieStampa.Nome = 'Asporto'
      ) AS decimal(10, 2)
    ) AS asporto,
    CAST(
      (
        SELECT
          SUM(
            tblContiPortate.Prezzo * tblContiPortate.Quantità
          )
        FROM
          (
            tblMenùPortate
            JOIN tblContiPortate ON(
              tblMenùPortate.IDMenùPortate = tblContiPortate.FKMenùPortate
            )
          )
        WHERE
          tblContiPortate.FKConto = c.IDConto
      ) - COALESCE(c.Sconto, 0) AS decimal(10, 2)
    ) AS totale,
    c.cancellato

  FROM
    tblConti c
  WHERE
    c.DataStampa >= CURDATE() - INTERVAL 1 DAY
    AND c.cancellato = 1
    `);

  if (!(rows instanceof Array)) throw new Error('Rows isn\'t an array');

  if (rows.length === 0) {
    // await sendEmail(['alberto@plannervision.com'], 'Vini da verificare', `<p>Spettabile ${intestazione},</p><p>Non ci sono dati da verificare.</p>`);
    // console.log('No data to send');
    return;
  }

  let newData = [];

  // newData.push(['', selectedDay.format('dddd, LL')]);

  let header = [];
  for (let field of fields) {
    header.push(field.name);
  }
  newData.push(header);

  for (let row of rows) {
    newData.push(Object.values(row));
  }

  let tmpDir = os.tmpdir();
  let filePath = path.join(tmpDir, FILENAME);

  await xmls(newData, filePath, WORKSHEET_COLS, WORKSHEET_MARGIN);

  await sendEmail(
    emailsTo,
    'Conti da verificare',
    `<p>Spettabile ${intestazione},</p><p>in allegato i dati richiesti.</p>`,
    [{ path: filePath }]
  );

}
