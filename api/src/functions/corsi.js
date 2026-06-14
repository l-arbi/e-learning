const { app } = require('@azure/functions');
const { getCatalogoSenzaSoluzioni } = require('../data/catalogo');

// GET /api/corsi — restituisce il catalogo corsi senza le soluzioni degli esami
app.http('corsi', {
  methods: ['GET'],
  authLevel: 'anonymous',
  route: 'corsi',
  handler: async (request, context) => {
    context.log('GET /api/corsi chiamato');

    try {
      const catalogo = getCatalogoSenzaSoluzioni();

      return {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        },
        body: JSON.stringify({
          success: true,
          data: catalogo,
          totale: catalogo.length
        })
      };

    } catch (error) {
      context.log.error('Errore in GET /api/corsi:', error);
      return {
        status: 500,
        body: JSON.stringify({ success: false, errore: 'Errore interno del server' })
      };
    }
  }
});
