// server.js - VERSÃO DE TESTE MÍNIMA

const express = require('express');
const app = express();
const PORT = process.env.PORT || 1000;

// A única rota que existe é a de verificação de saúde.
app.get('/health', (req, res) => {
  // Adicionamos um log para sabermos se a Railway está chamando esta rota.
  console.log('>>> Rota /health foi chamada com sucesso!'); 
  res.status(200).send('Servidor de teste está OK');
});

// Uma rota principal para vermos algo no navegador.
app.get('/', (req, res) => {
    res.send('<h1>Servidor de Teste no Ar</h1><p>Se você está vendo isso, o deploy funcionou.</p>');
});

app.listen(PORT, () => {
  console.log(`>>> SERVIDOR DE TESTE MÍNIMO rodando na porta ${PORT}.`);
});