import { ILoggerOptions, logLevel } from '@wirgei/logger';

export const mysqlSynology = {
  host: '10.0.0.20',
  user: 'mailer',
  password: 'byNHuUNwc2cGbyNHuUNwc2cG88!!',
  port: 3307,
  database: 'cassa',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  typeCast: (field: any, useDefaultTypeCasting: any) => {
    if ((field.type === 'BIT') && (field.length === 1)) {

      let bytes = field.buffer();
      return (bytes[0] === 1);
    }
    return (useDefaultTypeCasting());
  }
};

export const logger: { config: ILoggerOptions } = {
  config: {
    logLevel: logLevel.DEBUG,
    alwaysShowStackTrace: true
  }
};

export const smpt =
{
  host: "smtp.gmail.com",
  port: 587,
  secure: false,
  requireTLC: true,
  auth: {
    user: "alberto@miramontilaltro.it",
    pass: "hojligfczubhozof", // Generata andando a creare una nuova password per applicazioni di terze parti nell'account google dell'utente
  }
}