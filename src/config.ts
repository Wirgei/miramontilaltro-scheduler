import { ILoggerOptions, logLevel } from '@wirgei/logger';

export const mysql = {
  host: 'xfarma.it',
  user: 'mailer',
  password: 'byNHuUNwc2cG',
  port: 13306,
  database: 'magento',
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
    user: "it@xfarma.it",
    pass: "ubbdmfmrxfqecgyu",
  }
}