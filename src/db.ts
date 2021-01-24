import * as config from './config';
import * as Mysql from 'mysql2/promise';


let pool: Mysql.Pool | undefined;

export let query = async (sql: string, values?: any | any[] | { [param: string]: any }) => {

  try {

    if (!pool) pool = Mysql.createPool(config.mysql);

    return await pool.query(sql, values);
  } catch (err) {
    // eslint-disable-next-line no-console
    console.log(`Query code: ${sql}`);
    // eslint-disable-next-line no-console
    console.log(err);
    throw err;
  }
};

export let end = async(): Promise<void> => {
  console.log('Closing pool');
  if(pool) await pool.end();
  pool = undefined;
};

export let start_transaction = async (): Promise<void> => {
  // eslint-disable-next-line no-console
  // console.log('\nSTART TRANSACTION');
  await query('START TRANSACTION');
};

export let commit = async (): Promise<void> => {
  // eslint-disable-next-line no-console
  // console.log('\nCOMMIT');
  await query('COMMIT');
};

export let rollback = async (): Promise<void> => {
  // eslint-disable-next-line no-console
  // console.log('\nROLLBACK');
  await query('ROLLBACK');
};