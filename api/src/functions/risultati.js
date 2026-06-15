const { app } = require('@azure/functions');
const { getSoluzioni } = require('../data/catalogo');

// Registro esiti in memoria
// NOTA: in produzione con Azure SQL Standard questi dati vengono salvati
// nella tabella RisultatiEsami tramite connessione database
const registroEsiti = [];

// POST /api/risultati — corregge lato server e salva l'esito
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
        return { status: 400, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ success: false, errore: 'Dati mancanti o non validi' }) };
      }

      const soluzioni = getSoluzioni(corsoId, esameId);
      if (!soluzioni) {
        return { status: 404, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ success: false, errore: 'Esame non trovato' }) };
      }

      let risposteCorrette = 0;
      const dettaglio = risposte.map((risposta, index) => {
        const corretta = risposta === soluzioni[index];
        if (corretta) risposteCorrette++;
        return { domanda: index + 1, corretta };
      });

      const punteggio = Math.round((risposteCorrette / soluzioni.length) * 30);
      const superato = punteggio >= 18;

      const esito = {
        id: registroEsiti.length + 1,
        studenteId,
        studenteNome: studenteNome || studenteId.split('@')[0],
        corsoId,
        esameId,
        punteggio,
        risposteCorrette,
        totaleDomande: soluzioni.length,
        superato,
        dataOra: new Date().toISOString()
      };
      registroEsiti.push(esito);

      context.log(`Esame corretto: ${studenteId}, punteggio ${punteggio}/30`);

      return {
        status: 200,
        headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
        body: JSON.stringify({ success: true, punteggio, risposteCorrette, totaleDomande: soluzioni.length, superato, dettaglio })
      };

    } catch (error) {
      context.log.error('Errore POST /api/risultati:', error);
      return { status: 500, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ success: false, errore: 'Errore interno: ' + error.message }) };
    }
  }
});

// GET /api/risultati
app.http('risultati-get', {
  methods: ['GET'],
  authLevel: 'anonymous',
  route: 'risultati',
  handler: async (request, context) => {
    context.log('GET /api/risultati chiamato');
    try {
      const studenteId = request.query.get('studenteId');
      const esiti = studenteId
        ? registroEsiti.filter(e => e.studenteId === studenteId)
        : registroEsiti;

      return {
        status: 200,
        headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
        body: JSON.stringify({ success: true, data: esiti, totale: esiti.length })
      };
    } catch (error) {
      context.log.error('Errore GET /api/risultati:', error);
      return { status: 500, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ success: false, errore: error.message }) };
    }
  }
});
