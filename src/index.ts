import * as db from './db';
import fs from 'fs';

main();

async function main() {

  try {
    let orders = async () => {

      let orderFile = fs.createWriteStream('orders.csv');

      let [rows, fields] = await db.query(`
        SELECT YEAR(i.created_at) AS anno
      , MONTH(i.created_at) AS mese
      , i.sku
      , a.postcode
      , upper(a.region) AS provincia
      , COUNT(o.entity_id) AS num

      FROM magento.sales_order o

        INNER JOIN magento.sales_order_address a
          ON o.entity_id = a.parent_id
          
        INNER JOIN magento.sales_order_item i
          ON o.entity_id = i.order_id

      WHERE o.state = 'complete'
        AND a.address_type = 'billing'
      -- 	AND	o.increment_id = '000001167'
      -- 	AND i.created_at >= last_day(now()) + interval 1 day - interval 1 MONTH
        AND YEAR(i.created_at) = YEAR(CURRENT_DATE - INTERVAL 1 MONTH)
        AND MONTH(i.created_at) = MONTH(CURRENT_DATE - INTERVAL 1 MONTH)
      
      GROUP BY YEAR(i.created_at)
      , MONTH(i.created_at)
      , i.sku
      , a.postcode
      , a.region

      limit 10
    `);

      let header = [];
      for (let field of fields) {

        header.push(field.name);
      }
      orderFile.write(header.join(';') + '\r\n');

      if (!(rows instanceof Array)) throw new Error('Rows isn\'t an array');

      for (let row of rows) {

        orderFile.write(Object.values(row).join(';') + '\r\n');
      }

      return orderFile.path;
    }

    console.log(await orders());


  }
  catch (err) {
    console.log(err);
  }
  finally {
    db.end();
  }


}



