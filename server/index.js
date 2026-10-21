const express = require('express');
const cors = require('cors');
const os = require('os');
const path = require('path');
const apiRoutes = require('./routes');
require('./config/db'); // Garante conexão inicial ao PostgreSQL

const app = express();

app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

// Servir arquivos enviados (currículos em PDF, avatares, etc.)
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Log de requisições simplificado
app.use((req, res, next) => {
  console.log(`[${new Date().toLocaleTimeString()}] ${req.method} ${req.url}`);
  next();
});

// Health check
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    version: '2.0.0',
    architecture: 'modular-mvc',
    database: 'fatelinkBD',
    timestamp: new Date()
  });
});

// Rotas modulares da API
app.use('/api', apiRoutes);

// Fallback para rotas não mapeadas
app.use('/api', (req, res) => {
  res.status(404).json({ error: `Rota ${req.method} ${req.originalUrl} não encontrada no backend.` });
});

function getLocalIp() {
  const nets = os.networkInterfaces();
  for (const name of Object.keys(nets)) {
    for (const net of nets[name] || []) {
      if (net.family === 'IPv4' && !net.internal) {
        return net.address;
      }
    }
  }
  return 'localhost';
}

const PORT = process.env.PORT || 3000;

if (!process.env.VERCEL) {
  app.listen(PORT, '0.0.0.0', () => {
    const localIp = getLocalIp();
    console.log(`🚀 FateLink 2.0 Backend (Modular) rodando em http://localhost:${PORT}`);
    console.log(`📱 Acesso via rede local: http://${localIp}:${PORT}`);
  });
}

module.exports = app;
