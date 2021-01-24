import { ILoggerOptions, logLevel } from '@wirgei/logger';

export const mysql = {
  host: '54.36.112.202',
  user: 'mailer',
  password: 'byNHuUNwc2cG',
  port: 3306,
  database: 'magento',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  typeCast: ( field: any, useDefaultTypeCasting: any ) => {
    if ( ( field.type === 'BIT' ) && ( field.length === 1 ) ) {

      let bytes = field.buffer();
      return( bytes[ 0 ] === 1 );
    }
    return( useDefaultTypeCasting() );
  }
};

export const logger: { config: ILoggerOptions } = {
  config: {
    logLevel: logLevel.DEBUG,
    alwaysShowStackTrace: true
  }
};