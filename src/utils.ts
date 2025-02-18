import * as fs from 'fs';
import { smpt } from './config';
import nodemailer, { TransportOptions } from 'nodemailer';
import * as XLSX from 'xlsx';

export function getFilesInFolder(folderPath: string): Promise<string[]> {
    return new Promise((resolve, reject) => {
        fs.readdir(folderPath, (err, files) => {
            if (err) {
                reject(`Error reading the folder: ${err}`);
                return;
            }

            try {
                const onlyFiles = files.filter(file => {
                  return file;  
                  
                  // const filePath = path.join(folderPath, file);
                    // return fs.statSync(filePath).isFile();
                });

                resolve(onlyFiles);
            } catch (error) {
                reject(`Error processing files: ${error}`);
            }
        });
    });
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

export async function pause(timeout: number) {
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
