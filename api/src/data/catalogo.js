// Catalogo corsi — simula i dati che in produzione vengono da Azure SQL
const corsi = [
  {
    id: 1,
    titolo: "Cloud Computing su Azure",
    docente: "Prof. Bianchi",
    descrizione: "Fondamenti di cloud computing con Microsoft Azure: IaaS, PaaS, SaaS e architetture cloud-native.",
    durata: "40 ore",
    livello: "Intermedio",
    lezioni: [
      { id: 1, titolo: "Introduzione al Cloud", durata: "45 min" },
      { id: 2, titolo: "Servizi Azure principali", durata: "60 min" },
      { id: 3, titolo: "Virtual Machines e App Service", durata: "60 min" },
      { id: 4, titolo: "Storage e Database", durata: "55 min" },
      { id: 5, titolo: "Sicurezza e Identity", durata: "50 min" }
    ],
    esame: {
      id: 1,
      titolo: "Esame finale — Cloud Computing",
      domande: [
        {
          id: 1,
          testo: "Quale servizio Azure è più adatto per ospitare un'applicazione web senza gestire l'infrastruttura?",
          opzioni: ["Virtual Machine", "App Service", "Blob Storage", "VNet"],
          corretta: 1
        },
        {
          id: 2,
          testo: "Cosa significa IaaS?",
          opzioni: ["Internet as a Service", "Infrastructure as a Service", "Integration as a Service", "Identity as a Service"],
          corretta: 1
        },
        {
          id: 3,
          testo: "Quale servizio Azure gestisce chiavi e segreti in modo sicuro?",
          opzioni: ["Azure Monitor", "Azure Key Vault", "Azure AD", "Azure CDN"],
          corretta: 1
        },
        {
          id: 4,
          testo: "Qual è il vantaggio principale del modello serverless?",
          opzioni: ["Costo fisso mensile", "Paghi solo per le esecuzioni", "Nessuna scalabilità", "Richiede un server dedicato"],
          corretta: 1
        },
        {
          id: 5,
          testo: "Azure Blob Storage è ottimizzato per:",
          opzioni: ["Query SQL complesse", "Archiviazione di oggetti non strutturati", "Elaborazione in tempo reale", "Bilanciamento del carico"],
          corretta: 1
        }
      ]
    }
  },
  {
    id: 2,
    titolo: "Cybersecurity e protezione dati",
    docente: "Prof. Verdi",
    descrizione: "Principi di sicurezza informatica, protezione dei dati e conformità GDPR in ambienti cloud.",
    durata: "30 ore",
    livello: "Avanzato",
    lezioni: [
      { id: 1, titolo: "Fondamenti di Cybersecurity", durata: "50 min" },
      { id: 2, titolo: "Crittografia e certificati", durata: "60 min" },
      { id: 3, titolo: "GDPR e conformità", durata: "45 min" },
      { id: 4, titolo: "WAF e protezione applicazioni", durata: "55 min" }
    ],
    esame: {
      id: 2,
      titolo: "Esame finale — Cybersecurity",
      domande: [
        {
          id: 1,
          testo: "Cosa protegge un WAF (Web Application Firewall)?",
          opzioni: ["La rete fisica", "Le applicazioni web da attacchi OWASP", "Il database SQL", "I file nel Blob Storage"],
          corretta: 1
        },
        {
          id: 2,
          testo: "Il GDPR si applica a:",
          opzioni: ["Solo aziende americane", "Dati personali di cittadini UE", "Solo grandi aziende", "Solo dati bancari"],
          corretta: 1
        },
        {
          id: 3,
          testo: "TLS 1.2 garantisce:",
          opzioni: ["Compressione dei dati", "Cifratura del traffico in transito", "Autenticazione biometrica", "Backup automatico"],
          corretta: 1
        }
      ]
    }
  },
  {
    id: 3,
    titolo: "Python per il Cloud",
    docente: "Prof. Neri",
    descrizione: "Programmazione Python applicata allo sviluppo di soluzioni cloud: API, automazione e data processing.",
    durata: "35 ore",
    livello: "Base",
    lezioni: [
      { id: 1, titolo: "Introduzione a Python", durata: "60 min" },
      { id: 2, titolo: "API REST con Flask", durata: "70 min" },
      { id: 3, titolo: "Connessione ad Azure SQL", durata: "55 min" },
      { id: 4, titolo: "Deploy su Azure Functions", durata: "60 min" }
    ],
    esame: {
      id: 3,
      titolo: "Esame finale — Python Cloud",
      domande: [
        {
          id: 1,
          testo: "Quale libreria Python si usa per creare API REST?",
          opzioni: ["NumPy", "Flask", "Matplotlib", "Pandas"],
          corretta: 1
        },
        {
          id: 2,
          testo: "In Python, come si apre un file in lettura?",
          opzioni: ["open('file', 'w')", "open('file', 'r')", "read('file')", "file.open('r')"],
          corretta: 1
        }
      ]
    }
  }
];

// Esporta senza le risposte corrette (sicurezza lato client)
function getCatalogoSenzaSoluzioni() {
  return corsi.map(corso => ({
    ...corso,
    esame: {
      ...corso.esame,
      domande: corso.esame.domande.map(({ corretta, ...domanda }) => domanda)
    }
  }));
}

// Esporta con le soluzioni (solo lato server per correzione)
function getSoluzioni(corsoId, esameId) {
  const corso = corsi.find(c => c.id === corsoId);
  if (!corso || corso.esame.id !== esameId) return null;
  return corso.esame.domande.map(d => d.corretta);
}

module.exports = { getCatalogoSenzaSoluzioni, getSoluzioni };
