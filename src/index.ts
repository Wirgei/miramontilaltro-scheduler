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

      pharmaExtracta: async (intestazione: string) => {

        console.log('PHARMEXTRACTA');

        let orderFile = fs.createWriteStream('orders.csv');

        let [rows, fields] = await db.query(`
        SELECT YEAR(i.created_at) AS anno
      , MONTH(i.created_at) AS mese
      , i.sku
      , i.name AS nome
      , a.postcode
      , upper(a.region) AS provincia
      , COUNT(o.entity_id) AS num

      FROM magento.sales_order o

        INNER JOIN magento.sales_order_address a
          ON o.entity_id = a.parent_id
          
        INNER JOIN magento.sales_order_item i
          ON o.entity_id = i.order_id
          
        INNER JOIN magento.catalog_product_entity ent
          ON ent.sku = i.sku
          
        

      WHERE o.state = 'complete'
        AND a.address_type = 'billing'
      -- 	AND	o.increment_id = '000001167'
      -- 	AND i.created_at >= last_day(now()) + interval 1 day - interval 1 MONTH
        AND YEAR(i.created_at) = YEAR(CURRENT_DATE - INTERVAL 1 MONTH)
        AND MONTH(i.created_at) = MONTH(CURRENT_DATE - INTERVAL 1 MONTH)
      --  AND MONTH(i.created_at)  = 1

        AND ( SELECT VALUE FROM eav_attribute_option_value aaotv WHERE aaotv.option_id =
        (
          SELECT value 
          FROM catalog_product_entity_int cat
          WHERE cat.entity_id = ent.entity_id
            AND cat.store_id = 0
            AND cat.attribute_id = (
              SELECT attribute_id 
              FROM eav_attribute 
              WHERE attribute_code = 'manufacturer' 
                AND entity_type_id = (SELECT entity_type_id FROM eav_entity_type WHERE entity_type_code = 'catalog_product')
            )
        )) IN ('PHARMEXTRACTA')
      
      GROUP BY YEAR(i.created_at)
      , MONTH(i.created_at)
      , i.sku
      , a.postcode
      , a.region

      -- HAVING COUNT(o.entity_id) > 1


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
          to: "alberto@plannervision.com, massi@xfarma.it, n.ferrari@pharmextracta.com", // list of receivers
          // to: "wirgei@gmail.com", // list of receivers
          subject: "xFarma.it - Statistiche di vendita", // Subject line
          // text: "Hello world?", // plain text body
          html: `
        <p>Spettabile ${intestazione},</p>
        <p>come da accordi, inviamo in allegato i dati richiesti relativi al mese scorso.</p><br />
        <p>Cordialmente</p>
        <p>xFarma.it</p>       
        `, // html body
          attachments: [

            { path: orderFile.path.toString() }
          ]
        });

        console.log({ info });


      },

      manetti: async (intestazione: string) => {

        console.log('L.MANETTI-H.ROBERTS & C.');

        let orderFile = fs.createWriteStream('orders.csv');

        let [rows, fields] = await db.query(`
        SELECT YEAR(i.created_at) AS anno
      , MONTH(i.created_at) AS mese
      , i.sku
      , i.name AS nome
      , a.postcode
      , upper(a.region) AS provincia
      , COUNT(o.entity_id) AS num

      FROM magento.sales_order o

        INNER JOIN magento.sales_order_address a
          ON o.entity_id = a.parent_id
          
        INNER JOIN magento.sales_order_item i
          ON o.entity_id = i.order_id
          
        INNER JOIN magento.catalog_product_entity ent
          ON ent.sku = i.sku
          
        

      WHERE o.state = 'complete'
        AND a.address_type = 'billing'
      -- 	AND	o.increment_id = '000001167'
      -- 	AND i.created_at >= last_day(now()) + interval 1 day - interval 1 MONTH
        AND YEAR(i.created_at) = YEAR(CURRENT_DATE - INTERVAL 1 MONTH)
        AND MONTH(i.created_at) = MONTH(CURRENT_DATE - INTERVAL 1 MONTH)
      --  AND MONTH(i.created_at)  = 1

        AND ( SELECT VALUE FROM eav_attribute_option_value aaotv WHERE aaotv.option_id =
        (
          SELECT value 
          FROM catalog_product_entity_int cat
          WHERE cat.entity_id = ent.entity_id
            AND cat.store_id = 0
            AND cat.attribute_id = (
              SELECT attribute_id 
              FROM eav_attribute 
              WHERE attribute_code = 'manufacturer' 
                AND entity_type_id = (SELECT entity_type_id FROM eav_entity_type WHERE entity_type_code = 'catalog_product')
            )
        )) IN ('L.MANETTI-H.ROBERTS & C.')
      
      GROUP BY YEAR(i.created_at)
      , MONTH(i.created_at)
      , i.sku
      , a.postcode
      , a.region

      -- HAVING COUNT(o.entity_id) > 1


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
          to: "alberto@plannervision.com, massi@xfarma.it, amanzella@manettiroberts.it", // list of receivers
          // to: "wirgei@gmail.com", // list of receivers
          subject: "xFarma.it - Statistiche di vendita", // Subject line
          // text: "Hello world?", // plain text body
          html: `
        <p>Spettabile ${intestazione},</p>
        <p>come da accordi, inviamo in allegato i dati richiesti relativi al mese scorso.</p><br />
        <p>Cordialmente</p>
        <p>xFarma.it</p>       
        `, // html body
          attachments: [

            { path: orderFile.path.toString() }
          ]
        });

        console.log({ info });


      },

    }

    for (let arg of ArgumentsArray) {
      
      switch (arg.toUpperCase()) {
        case 'PHARMEXTRACTA':
          await emailList.pharmaExtracta('PHARMEXTRACTA');
          break;

        case 'MANETTI':
          await emailList.manetti('L.MANETTI-H.ROBERTS & C.');
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



