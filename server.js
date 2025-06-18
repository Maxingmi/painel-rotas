// server.js - Versão para Vercel (sem socket.io e sem static)

const express = require('express');
const app = express();

// A programação de rotas continua a mesma
const programacao = [
    ['19:00', 'ROTA 069/072'], ['20:30', 'ROTA 039'], ['22:00', 'ROTA 068/081-043/049'],
    ['23:00', 'ROTA 029/055/026'], ['23:50', 'ROTA 030/086'], ['00:00', 'ROTA 035/037'],
    ['00:15', 'ROTA 045/076'], ['01:30', 'ROTA 007/036'], ['02:30', 'ROTA 064/066'],
    ['03:40', 'ROTA 044'], ['04:00', 'ROTA 033/038'], ['05:00', 'ROTA 006/034']
];

// Função para obter a hora de São Paulo (UTC-3)
function getSaoPauloTime() {
    const agora = new Date();
    return new Date(agora.toLocaleString('en-US', { timeZone: 'America/Sao_Paulo' }));
}

// Função que calcula a rota atual e as passadas.
function calcularStatusRotas() {
    const agora = getSaoPauloTime();
    let proximaRotaEncontrada = null;
    let historicoRotas = [];

    const programacaoOrdenada = [...programacao].sort((a, b) => a[0].localeCompare(b[0]));

    for (const rota of programacaoOrdenada) {
        const [hora, minuto] = rota[0].split(':');
        const horarioRotaHoje = getSaoPauloTime();
        horarioRotaHoje.setHours(parseInt(hora, 10), parseInt(minuto, 10), 0, 0);

        const nomeRota = rota[1];
        const horarioSaida = `Saída às ${rota[0]}`;

        if (horarioRotaHoje < agora) {
            historicoRotas.unshift({ nome: nomeRota, horario: horarioSaida });
        } else if (!proximaRotaEncontrada) {
            proximaRotaEncontrada = { nome: nomeRota, horario: horarioSaida };
        }
    }

    if (!proximaRotaEncontrada && programacaoOrdenada.length > 0) {
        const primeiraRota = programacaoOrdenada[0];
        proximaRotaEncontrada = {
            nome: primeiraRota[1],
            horario: `Saída às ${primeiraRota[0]}`
        };
    }
    
    if (!proximaRotaEncontrada) {
       proximaRotaEncontrada = { nome: 'Nenhuma rota programada.', horario: '' };
    }

    if (historicoRotas.length > 10) {
        historicoRotas = historicoRotas.slice(0, 10);
    }
    
    return {
        proxima: proximaRotaEncontrada,
        passadas: historicoRotas
    };
}

// REMOVEMOS a linha app.use(express.static('public'));

// CRIAÇÃO DO ENDPOINT DA API
app.get('/api/status', (req, res) => {
    const status = calcularStatusRotas();
    res.json(status);
});

// A Vercel não usa o app.listen. Em vez disso, exportamos o app.
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Servidor rodando na porta ${PORT} para testes locais.`);
});

// ESSA LINHA É A MAIS IMPORTANTE PARA A VERCEL
module.exports = app;
