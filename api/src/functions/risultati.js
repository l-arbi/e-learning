const { app } = require('@azure/functions');
const { getSoluzioni } = require('../data/catalogo');

// Registro esiti in memoria (in produzione: Azure SQL)
const registroEsiti = [];

// POST /api/risultati — riceve le risposte, corregge lato server e salva l'esito
app.http('risultati-post', {
  methods: ['POST'],
  authLevel: 'anonymous',
  route: 'risultati',
  handler: async (request, context) => {
    context.log('POST /api/risultati chiamato');

    try {
      const body = await request.json();
      const { studenteId, studenteNome, corsoId, esameId, risposte } = body;

      // Validazione input (never trust the client)
      if (!studenteId || !corsoId || !esameId || !Array.isArray(risposte)) {
        return {
          status: 400,
          body: JSON.stringify({ success: false, errore: 'Dati mancanti o non validi' })
        };
      }

      // Recupera le soluzioni corrette lato server
      const soluzioni = getSoluzioni(corsoId, esameId);
      if (!soluzioni) {
        return {
          status: 404,
          body: JSON.stringify({ success: false, errore: 'Esame non trovato' })
        };
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

      // Salva nel registro (in produzione: INSERT su Azure SQL)
      const esito = {
        id: registroEsiti.length + 1,
        studenteId,
        studenteNome: studenteNome || 'Anonimo',
        corsoId,
        esameId,
        punteggio,
        risposteCorrette,
        totaleDomande: soluzioni.length,
        superato,
        dataOra: new Date().toISOString()
      };
      registroEsiti.push(esito);

      context.log(`Esame corretto: studente ${studenteId}, punteggio ${punteggio}/30`);

      return {
        status: 200,
        headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
        body: JSON.stringify({
          success: true,
          punteggio,
          risposteCorrette,
          totaleDomande: soluzioni.length,
          superato,
          dettaglio
        })
      };

    } catch (error) {
      context.log.error('Errore in POST /api/risultati:', error);
      return {
        status: 500,
        body: JSON.stringify({ success: false, errore: 'Errore interno del server' })
      };
    }
  }
});

// GET /api/risultati — registro esiti (per docenti e admin)
app.http('risultati-get', {
  methods: ['GET'],
  authLevel: 'anonymous',
  route: 'risultati',
  handler: async (request, context) => {
    context.log('GET /api/risultati chiamato');

    try {
      const studenteId = request.query.get('studenteId');

      // Se passa studenteId, filtra per quello studente
      const esiti = studenteId
        ? registroEsiti.filter(e => e.studenteId === studenteId)
        : registroEsiti;

      return {
        status: 200,
        headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
        body: JSON.stringify({
          success: true,
          data: esiti,
          totale: esiti.length
        })
      };

    } catch (error) {
      context.log.error('Errore in GET /api/risultati:', error);
      return {
        status: 500,
        body: JSON.stringify({ success: false, errore: 'Errore interno del server' })
      };
    }
  }
});
