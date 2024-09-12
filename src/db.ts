import * as config from './config';
import * as Mysql from 'mysql2/promise';


let pool: Mysql.Pool | undefined;

export let query = async (sql: string, values?: any | any[] | { [param: string]: any }) => {

  try {

    if (!pool) pool = Mysql.createPool(config.mysqlSynology);

    return await pool.query(sql, values);
  } catch (err) {
    console.log(`Query code: ${sql}`);
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
  await query('START TRANSACTION');
};

export let commit = async (): Promise<void> => {
  await query('COMMIT');
};

export let rollback = async (): Promise<void> => {
  await query('ROLLBACK');
};