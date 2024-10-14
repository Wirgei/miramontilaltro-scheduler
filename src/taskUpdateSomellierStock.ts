import moment from 'moment';
import * as db from './db';

// taskUpdateSomellierStock(2);
export default async function taskUpdateSomellierStock(days:  number = 1) {

  console.log('taskUpdateSomellierStock days:', days);

  let selectedDay = moment().subtract(Math.abs(days), 'day');

  let [rows] = await db.query<{id_vino: number, descrizione: string, qta: number, data_stampa: Date}>(`              
    SELECT cp.FKEsterno AS id_vino
    , cp.NomePortateFinale AS descrizione
    , sum(cp.Quantità) AS qta 
    , c.DataStampa as data_stampa
    
    FROM cassa.tblConti c
    INNER JOIN cassa.tblContiPortate cp ON cp.FKConto = c.IDConto
      LEFT JOIN cassa.tblMenùPortate mp ON mp.IDMenùPortate = cp.FKMenùPortate
      LEFT JOIN cassa.tblMenù m ON m.IDMenù = mp.FKMenù
      LEFT JOIN cassa.tblPortate p ON p.IDPortata = mp.FKPortate
      LEFT JOIN cassa.tblPortateCategorie pc ON pc.IDPortateCategoria = p.FKPortateCategorie

    WHERE c.DataStampa = '${selectedDay.format("YYYY-MM-DD")}'
      AND pc.Nome = 'Vini'
      AND cp.FKEsterno IS NOT null

    GROUP BY cp.FKEsterno
    , cp.NomePortateFinale
    , c.DataStampa
    `
  );

  try {
    db.start_transaction();

    if (!(rows instanceof Array)) throw new Error('Rows isn\'t an array');

    for (let row of rows) {

      db.query('UPDATE cantina.tblVini v SET v.GiacenzaCantina = v.GiacenzaCantina - ? WHERE v.IDvino = ?', [row.qta, row.id_vino]);

      // row.data_stampa.setHours(23, 59, 0, 0);

      db.query(`INSERT INTO cantina.tblViniStoricoSommelier (FKVino, FKProduttore, DescrizioneVino, AnnataVino, FKFormatoBottiglie, BottScaricate, user) VALUES 
        ( 
          ?, 
          (SELECT v.FKProduttore FROM cantina.tblVini v WHERE v.IDVino = ?), 
          ?, 
          (SELECT v.AnnataVino FROM cantina.tblVini v WHERE v.IDVino = ?), 
          (SELECT v.FKFormatoBottiglie FROM cantina.tblVini v WHERE v.IDVino = ?),
          ?,
          ?
        )`, 
        [
          row.id_vino, 
          row.id_vino, // FKProduttore
          row.descrizione, 
          row.id_vino, // Annata
          row.id_vino, // FKFormatoBottiglie
          row.qta, 
          // row.data_stampa, 
          'Cassa'
        ]
      );

    }

    db.commit();
  } catch (e) {
    console.error(e);
    db.rollback();
  }
}