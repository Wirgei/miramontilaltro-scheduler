import * as db from './db';
import fs from 'fs';
import { smpt } from './config';
import nodemailer from 'nodemailer';

// const EMAIL_XFARMA = ['wirgei@gmail.com', 'massi@xfarma.it'];
// const EMAIL_SUPPLIERS = ['alberto@plannervision.com', 'massi@xfarma.it', 'lorenzo.lazzarini@aesculapius.it'];


// Hard code mail receivers
const EMAIL_DEVELOPER = ['wirgei@gmail.com'];

const EMAIL_XFARMA = ['alberto@plannervision.it', 'massi@xfarma.it'];
const EMAILS_AESCULAPIUS = ['lorenzo.lazzarini@aesculapius.it'];
const EMAILS_PHARMEXTRACTA = ['a.callegari@pharmextracta.com', 'n.ferrari@pharmextracta.com'];
const EMAILS_MANETTI = ['amanzella@manettiroberts.it'];
const EMAILS_LABORATORI_LEGREN = ['lucio@laboratorilegren.it'];
const EMAILS_MAP_ITALIA = ['dati@mapitalia.com'];
const EMAILS_BENEFICA = ['info@benefica.it'];
const EMAILS_COMMERCIALISTA = ['massi@xfarma.it', 'amministrazione@xfarma.it'];

main();
// main(true, false); // testare mandando le mail su wirgei@gmail.com

async function main(isTest: boolean = false, blockSend: boolean = false) {

  let pause = (timeout: number) => {
    return new Promise<void>((resolve) => {
      setTimeout(() => {
        resolve();
      }, timeout);
    })
  }

  let ArgumentsArray = [];

  for (let index = 2; index < process.argv.length; index++) {
    ArgumentsArray.push(process.argv[index].toUpperCase());
  }

  try {

    let emailList = {

      sellStats: async (intestazione: string, mysqlFilter: string, emailsTo: string[]) => {

        emailsTo = emailsTo.concat(EMAIL_XFARMA);
        if (isTest) emailsTo = EMAIL_DEVELOPER;

        let orderFile = fs.createWriteStream('orders.csv');

        let [rows, fields] = await db.query(`
              SELECT YEAR(i.created_at) AS anno
            , MONTH(i.created_at) AS mese
            , i.sku
            , i.name AS nome
            , a.postcode AS cap
            , upper(a.region) AS provincia
            -- , COUNT(o.entity_id) AS num
            , round(SUM(i.qty_invoiced) * 0.80 ,0) AS num

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
              )) IN ('${mysqlFilter}')
            
            GROUP BY YEAR(i.created_at)
            , MONTH(i.created_at)
            , i.sku
            , a.postcode
            , a.region

            -- HAVING COUNT(o.entity_id) > 1
          `
        );

        let header = [];
        for (let field of fields) {
          header.push(field.name);
        }
        orderFile.write(header.join(';') + '\r\n');

        if (!(rows instanceof Array)) throw new Error('Rows isn\'t an array');

        for (let row of rows) {

          orderFile.write(Object.values(row).join(';') + '\r\n');
        }

        let playload = {
          from: '"it@xfarma.it" <it@xfarma.it>', // sender address
          to: emailsTo.join(', '),
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
        };

        console.log({ playload });

        if (blockSend) return;

        let transporter = nodemailer.createTransport(smpt);
        let response = await transporter.sendMail(playload);
        console.log({ response });
      },
      sellVatStats: async (intestazione: string, emailsTo: string[]) => {

        emailsTo = emailsTo.concat(EMAIL_XFARMA);
        if (isTest) emailsTo = EMAIL_DEVELOPER;

        let orderFile = fs.createWriteStream('vatOrders.csv');

        let [rows, fields] = await db.query(`
          SELECT soa.country_id AS country
          , DATE_FORMAT(s.created_at, '%Y-%m-%d') AS payment_date
          --	, (SELECT DATE(h.created_at) FROM sales_shipment h WHERE h.order_id = s.entity_id) AS shipment_date

          /*
              , s.increment_id
              , s.entity_id AS order_id

              , IFNULL(s.grand_total,0) AS amount_total
              , IFNULL(s.tax_amount,0) AS amount_tax
              , IFNULL(s.grand_total,0) - IFNULL(s.tax_amount,0) AS amount_net 
              
              , IFNULL(s.shipping_amount,0) AS shipping_amount
              , IFNULL(s.shipping_tax_amount,0) AS shipping_tax_amount
              , IFNULL(s.shipping_amount,0) - IFNULL(s.shipping_tax_amount,0) AS shipping_net 
              
              , IFNULL(s.total_refunded,0) AS refunded_total
              , IFNULL(s.tax_refunded,0) AS refunded_tax
              , IFNULL(s.total_refunded,0) - IFNULL(s.tax_refunded,0) AS refuned_net
              
              , IFNULL(s.shipping_refunded,0) AS shipping_refunded
              , IFNULL(s.shipping_tax_refunded,0) AS shipping_tax_refunded
              , IFNULL(s.shipping_refunded,0) - IFNULL(s.shipping_tax_refunded,0) AS shipping_refunded_net
              , SUM(IFNULL(s.shipping_tax_amount,0) - IFNULL(s.shipping_tax_refunded,0)) AS shipping_tax
              
          */
              
            , SUM(IFNULL(s.grand_total,0) - IFNULL(s.total_refunded,0) - IFNULL(s.shipping_amount,0) - IFNULL(s.shipping_refunded,0))  AS goods_amount
            , SUM(IFNULL(s.tax_amount,0) - IFNULL(s.tax_refunded,0)) AS goods_tax
            
            , SUM(IFNULL(s.shipping_amount,0) - IFNULL(s.shipping_refunded,0)) AS shipping_amount
            , (SELECT MAX(t.rate) FROM tax_calculation_rate t WHERE t.tax_country_id = soa.country_id) AS local_max_vat
            , ROUND(SUM((IFNULL(s.shipping_amount,0) - IFNULL(s.shipping_refunded,0)) / (100 + (SELECT local_max_vat)) * (SELECT local_max_vat)),2)  AS shipping_tax
            , ROUND(SUM(
              IFNULL(s.tax_amount,0) - IFNULL(s.tax_refunded,0) +
              (IFNULL(s.shipping_amount,0) - IFNULL(s.shipping_refunded,0)) / (100 + (SELECT local_max_vat)) * (SELECT local_max_vat)
              ),2) AS total_tax
          , concat(GROUP_CONCAT(s.increment_id SEPARATOR '|'), '|') AS order_ids
              
          FROM sales_order AS s
          LEFT JOIN sales_order_tax AS sot ON s.entity_id = sot.order_id
          LEFT JOIN sales_order_address AS soa ON soa.parent_id = s.entity_id

          WHERE soa.address_type = 'shipping'
            AND s.state = "complete"
            AND soa.country_id NOT IN ("IT", "GB", "US")
            AND s.state = 'complete'
            AND YEAR(s.created_at) >= YEAR(CURRENT_DATE - INTERVAL 3 MONTH)
            AND MONTH(s.created_at) >= MONTH(CURRENT_DATE - INTERVAL 3 MONTH)
            AND YEAR(s.created_at) <= YEAR(CURRENT_DATE - INTERVAL 1 MONTH)
            AND MONTH(s.created_at) <= MONTH(CURRENT_DATE - INTERVAL 1 MONTH)
            
          -- AND s.increment_id = '2000003438'

          GROUP BY  soa.country_id
            , DATE_FORMAT(s.created_at, '%Y-%m-%d')
            , (SELECT MAX(t.rate) FROM tax_calculation_rate t WHERE t.tax_country_id = soa.country_id)

          HAVING SUM(IFNULL(s.tax_amount,0) - IFNULL(s.tax_refunded,0)) > 0
          `
        );

        let header = [];
        for (let field of fields) {
          header.push(field.name);
        }
        orderFile.write(header.join(';') + '\r\n');

        if (!(rows instanceof Array)) throw new Error('Rows isn\'t an array');

        const numberFormatter = new Intl.NumberFormat('it-IT', {
          minimumFractionDigits: 2,
          maximumFractionDigits: 2
        });

        for (let row of rows) {
          const formattedRow = Object.values(row).map(value => {
            if (!isNaN(value)) return numberFormatter.format(value);
            return value;
          });
          orderFile.write(formattedRow.join(';') + '\r\n');
        }

        let playload = {
          from: '"it@xfarma.it" <it@xfarma.it>', // sender address
          to: emailsTo.join(', '),
          subject: "xFarma.it - Statistiche di vendita EU", // Subject line
          // text: "Hello world?", // plain text body
          html: `
        <p>Spettabile ${intestazione},</p>
        <p>come da accordi, inviamo in allegato i dati richiesti.</p><br />
        <p>Cordialmente</p>
        <p>xFarma.it</p>       
        `, // html body
          attachments: [
            { path: orderFile.path.toString() }
          ]
        };

        console.log({ playload });

        if (blockSend) return;

        let transporter = nodemailer.createTransport(smpt);
        let response = await transporter.sendMail(playload);
        console.log({ response });
      },


    }

    for (let arg of ArgumentsArray) {

      switch (arg.toUpperCase()) {

        case 'PHARMEXTRACTA':
          await emailList.sellStats('PHARMEXTRACTA', 'PHARMEXTRACTA', EMAILS_PHARMEXTRACTA);
          break;

        case 'MANETTI':
          await emailList.sellStats('L.MANETTI-H.ROBERTS & C.', 'L.MANETTI-H.ROBERTS & C.', EMAILS_MANETTI);
          break;

        case 'AESCULAPIUS':
          await emailList.sellStats('AESCULAPIUS FARMACEUTICI', 'AESCULAPIUS FARMACEUTICI', EMAILS_AESCULAPIUS);
          break;

        case 'LABORATORI_LEGREN':
          await emailList.sellStats('LABORATORI LEGREN', 'LABORATORI LEGREN', EMAILS_LABORATORI_LEGREN);
          break;

        case 'MAP_ITALIA':
          await emailList.sellStats('MAP ITALIA', 'MAHARISHI AYURVEDA', EMAILS_MAP_ITALIA);
          break;

        case 'BENEFICA':
          await emailList.sellStats('Benefica', 'concessionaria Italia', EMAILS_BENEFICA);
          break;

        case 'COMMERCIALISTA':
          await emailList.sellVatStats('xFarma', EMAILS_COMMERCIALISTA);
          break;

        default:
          break;
      }

      await pause(1000);
    }








  }
  catch (err) {
    console.log(err);
  }
  finally {
    db.end();
  }


}



