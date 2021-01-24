import * as db from './db';
import fs from 'fs';
import { smpt } from './config';
import nodemailer from 'nodemailer';


main();

async function main() {

  let ArgumentsArray = [];

  for (let index = 2; index < process.argv.length; index++) {
    ArgumentsArray.push(process.argv[index].toUpperCase());
  }

  try {

    let emailList = {

      ordersCSV: async () => {

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

      -- limit 10
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

        let transporter = nodemailer.createTransport(smpt);


        let info = await transporter.sendMail({
          // from: '"Wirgei 👻" <it@xfarma.it>', // sender address
          from: '"it@xfarma.it" <it@xfarma.it>', // sender address
          to: "wirgei@gmail.com, massi@xfarma.it, n.ferrari@pharmextracta.com", // list of receivers
          subject: "xFarma.it - Statistiche di vendita", // Subject line
          // text: "Hello world?", // plain text body
          html: `
        <p>Spettabile PharmExtracta,</p>
        <p>come da accordi, inviamo in allegato i dati richiesti relativi al mese scorso.</p><br />
        <p>Cordialmente</p>
        <p>xFarma.it</p>       
        `, // html body
          attachments: [

            { path: orderFile.path.toString() }
          ]
        });

        console.log({ info });


      }

    }

    for (let arg of ArgumentsArray) {
      
      switch (arg.toUpperCase()) {
        case 'ORDERSCSV':
          await emailList.ordersCSV()
          break;
      
        default:
          break;
      }
    }








  }
  catch (err) {
    console.log(err);
  }
  finally {
    db.end();
  }


}



