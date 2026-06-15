const { app } = require('@azure/functions');
const { getSoluzioni } = require('../data/catalogo');
const sql = require('mssql');

const sqlConfig = {
  user: 'admindb',
  password: 'Z95UCgkwcUhcNX8',
  database: 'db-elearning',
  server: 'sql-elearning-dev.database.windows.net',
  options: {
    encrypt: true,
    trustServerCertificate: false
  }
};

async function getConnection() {
  return await sql.connect(sqlConfig);
}

// POST /api/risultati — corregge l'esame e salva su Azure SQL
app.http('risultati-post', {
  methods: ['POST'],
  authLevel: 'anonymous',
  route: 'risultati',
  handler: async (request, context) => {
    context.log('POST /api/risultati chiamato');
    try {
      const body = await request.json();
      const { studenteId, studenteNome, corsoId, esameId, risposte } = body;

      if (!studenteId || !corsoId || !esameId || !Array.isArray(risposte)) {
        return { status: 400, body: JSON.stringify({ success: false, errore: 'Dati mancanti o non validi' }) };
      }

      const soluzioni = getSoluzioni(corsoId, esameId);
      if (!soluzioni) {
        return { status: 404, body: JSON.stringify({ success: false, errore: 'Esame non trovato' }) };
      }

      // Correzione automatica lato server
      let risposteCorrette = 0;
      const dettaglio = risposte.map((risposta, index) => {
        const corretta = risposta === soluzioni[index];
        if (corretta) risposteCorrette++;
        return { domanda: index + 1, corretta };
      });

      const punteggio = Math.round((risposteCorrette / soluzioni.length) * 30);
      const superato = punteggio >= 18;

      // Salva su Azure SQL
      const pool = await getConnection();
      await pool.request()
        .input('StudenteId', sql.NVarChar, studenteId)
        .input('EsameId', sql.Int, esameId)
        .input('Punteggio', sql.Decimal(5,2), punteggio)
        .query('INSERT INTO RisultatiEsami (StudenteId, EsameId, Punteggio) VALUES (@StudenteId, @EsameId, @Punteggio)');

      context.log(`Esame salvato su SQL: studente ${studenteId}, punteggio ${punteggio}/30`);

      return {
        status: 200,
        headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
        body: JSON.stringify({ success: true, punteggio, risposteCorrette, totaleDomande: soluzioni.length, superato, dettaglio })
      };

    } catch (error) {
      context.log.error('Errore in POST /api/risultati:', error);
      return { status: 500, body: JSON.stringify({ success: false, errore: 'Errore interno del server' }) };
    }
  }
});

// GET /api/risultati — legge i risultati da Azure SQL
app.http('risultati-get', {
  methods: ['GET'],
  authLevel: 'anonymous',
  route: 'risultati',
  handler: async (request, context) => {
    context.log('GET /api/risultati chiamato');
    try {
      const studenteId = request.query.get('studenteId');
      const pool = await getConnection();

      let result;
      if (studenteId) {
        result = await pool.request()
          .input('StudenteId', sql.NVarChar, studenteId)
          .query(`SELECT r.Id, r.StudenteId, r.EsameId, r.Punteggio, r.DataSvolgimento,
                  e.CorsoId, CASE WHEN r.Punteggio >= 18 THEN 1 ELSE 0 END as Superato
                  FROM RisultatiEsami r
                  JOIN Esami e ON r.EsameId = e.Id
                  WHERE r.StudenteId = @StudenteId
                  ORDER BY r.DataSvolgimento DESC`);
      } else {
        result = await pool.request()
          .query(`SELECT r.Id, r.StudenteId, r.EsameId, r.Punteggio, r.DataSvolgimento,
                  e.CorsoId, CASE WHEN r.Punteggio >= 18 THEN 1 ELSE 0 END as Superato
                  FROM RisultatiEsami r
                  JOIN Esami e ON r.EsameId = e.Id
                  ORDER BY r.DataSvolgimento DESC`);
      }

      const esiti = result.recordset.map(r => ({
        id: r.Id,
        studenteId: r.StudenteId,
        studenteNome: r.StudenteId.split('@')[0],
        corsoId: r.CorsoId,
        esameId: r.EsameId,
        punteggio: r.Punteggio,
        superato: r.Superato === 1,
        dataOra: r.DataSvolgimento
      }));

      return {
        status: 200,
        headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
        body: JSON.stringify({ success: true, data: esiti, totale: esiti.length })
      };

    } catch (error) {
      context.log.error('Errore in GET /api/risultati:', error);
      return { status: 500, body: JSON.stringify({ success: false, errore: 'Errore interno del server' }) };
    }
  }
});
