import moment from 'moment';
import * as db from './db';
import * as os from 'os';
import * as path from 'path';
import { getFilesInFolder, sendEmail, xmls } from './utils';


interface IClientInvoice {
  DataStampa: string; // ISO date string
  Num: string,
  feNomeFile: string;
  IDCliente: number;
  Tipo: string;
  FKClientiTipo: string | null;
  FKFormePagamento: string | null;
  Società: string;
  Nome: string | null;
  Cognome: string | null;
  CodiceFiscale: string;
  PartitaIVA: string;
  Indirizzo: string;
  Civico: string;
  Città: string;
  CAP: string;
  Provincia: string;
  Nazione: string;
  Telefono: string | null;
  eMail: string | null;
  Note: string | null;
  DataModifica: string; // ISO date string
  InvioEmailAutomatico: boolean;
  errore: string;
}

export const taskCheckInvoiceStatus = async (intestazione: string, emailsTo: string[]): Promise<void> => {

  const SENT_INVOICE_FOLDER_PATH = '/volume1/remote/daniela/fatture/Trasmesse';
  const ERROR_INVOICE_FOLDER_PATH = '/volume1/remote/daniela/fatture/Errori';

  const WORKSHEET_COLS = [
    { wch: 11 },
    { wch: 5 },
    { wch: 11 },
    { wch: 24 },
    { wch: 30 },
    { wch: 20 },
    { wch: 20 },
    { wch: 20 },
    { wch: 10 },
    { wch: 20 },
  ];

  const WORKSHEET_MARGIN = { left: 0.0, right: 0.0, top: 0.0, bottom: 0.0, header: 0.0, footer: 0.0 };

  const DAYS = 2;

  let invoiceFailed: IClientInvoice[] = [];

  try {

    let [rows] = await db.query<IClientInvoice>(`              
      SELECT t.DataStampa
      , t.Numerazione as Num
      , t.feNomeFile
      , "" AS errore
      , c.* FROM tblConti t 
      LEFT JOIN tblClienti c ON c.IDCliente = t.FKCliente
      WHERE t.FKTipoDocumentoFiscale = 2 AND t.DataStampa >= DATE_SUB(CURRENT_DATE, INTERVAL ? DAY)
      ORDER BY t.Numerazione;
      `,
      [DAYS]
    );

    const invoiceSuccessFiles: string[] = await getFilesInFolder(SENT_INVOICE_FOLDER_PATH);
    const invoiceErrorFiles: string[] = await getFilesInFolder(ERROR_INVOICE_FOLDER_PATH);

    for (let i = 0; i < rows.length; i++) {
      const invoiceInfos = rows[i];
      const invoiceInfosNext = rows[i + 1];
      const isLastRow = i === rows.length - 1;

      // check if there is an invoice num missing
      if (invoiceInfos.Num === null) {
        invoiceFailed.push({ ...invoiceInfos, errore: 'Numero fattura mancante' });
      } else if (!isLastRow) {
        const currentNum = parseInt(invoiceInfos.Num, 10);
        const nextNum = parseInt(invoiceInfosNext.Num, 10);

        // Check if next number isn't exactly one more than current
        if (!isNaN(currentNum) && !isNaN(nextNum) && nextNum !== currentNum + 1) {
          // Create a note about the gap
          const gapMessage = `Sequenza interrotta: manca il numero ${currentNum + 1}`;
          invoiceFailed.push({ ...invoiceInfos, errore: gapMessage });
        }
      }

      // Check if the invoice file is in the sent folder
      if (!invoiceSuccessFiles.includes(invoiceInfos.feNomeFile)) invoiceFailed.push({ ...invoiceInfos, errore: 'Non inviata' });
      if (!invoiceSuccessFiles.includes(invoiceInfos.feNomeFile) && !invoiceErrorFiles.includes(invoiceInfos.feNomeFile)) invoiceFailed.push({ ...invoiceInfos, errore: 'Errore' });
    }

    console.log('Invoice failed:', invoiceFailed);

    if (!invoiceFailed.length) return;

    let newData = [];

    newData.push(['', moment().format('dddd, LL')]);

    let header = ['Data', 'Num', 'Errore', 'Numero', 'Nome File', 'Cliente', 'Codice Fiscale', 'Partita IVA', 'Indirizzo', 'Telefono', 'eMail'];
    newData.push(header);

    for (let row of invoiceFailed) {
      newData.push([
        row.DataStampa,
        row.Num,
        row.errore,
        row.feNomeFile,
        row.Società || ((row.Nome || '') + ' ' + (row.Cognome || '')),
        row.CodiceFiscale,
        row.PartitaIVA,
        row.Indirizzo || '' + row.Civico || '' + row.Città || '' + row.CAP || '' + row.Provincia || '' + row.Nazione || '',
        row.Telefono,
        row.eMail,
      ]);
    }

    let tmpDir = os.tmpdir();
    let filePath = path.join(tmpDir, 'fattureDaControllare.xlsx');

    await xmls(newData, filePath, WORKSHEET_COLS, WORKSHEET_MARGIN);

    await sendEmail(
      emailsTo,
      'Fatture da verificare',
      `<p>Spettabile ${intestazione},</p><p>in allegato i dati richiesti.</p>`,
      [{ path: filePath }]
    );

  } catch (error) {
    console.error(error);
  }

}
// taskCheckInvoiceStatus('Fatture da verificare', ['alberto@miramontilaltro.it']);
