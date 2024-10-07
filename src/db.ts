import * as config from './config';
import * as Mysql from 'mysql2/promise';


let pool: Mysql.Pool | undefined;

export let query = async <T>(sql: string, values?: any[]): Promise<[T[], Mysql.FieldPacket[]]> => {
  try {
    if (!pool) pool = Mysql.createPool(config.mysqlSynology as Mysql.PoolOptions);
    return await pool.query(sql, values) as [T[], Mysql.FieldPacket[]];
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