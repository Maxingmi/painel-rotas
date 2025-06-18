// server.js - Versão para Vercel (sem socket.io)

const express = require('express');
const app = express();

// A programação de rotas continua a mesma
const programacao = [
    ['19:00', 'ROTA 069/072'], ['20:30', 'ROTA 039'], ['22:00', 'ROTA 068/081-043/049'],
    ['23:00', 'ROTA 029/055/026'], ['23:50', 'ROTA 030/086'], ['00:00', 'ROTA 035/037'],
    ['00:15', 'ROTA 045/076'], ['01:30', 'ROTA 007/036'], ['02:30', 'ROTA 064/066'],
    ['03:40', 'ROTA 044'], ['04:00', 'ROTA 033/038'], ['05:00', 'ROTA 006/034']
];

// Variáveis para guardar o estado das rotas.
// Em um ambiente serverless real, isso não persiste entre as chamadas,
// mas a lógica abaixo recalcula tudo a cada vez, o que é o correto aqui.
let rotaAtual = { nome: 'Aguardando...', horario: '' };
let rotasPassadas = [];

// Função para obter a hora de São Paulo (UTC-3)
function getSaoPauloTime() {
    const agora = new Date();
    return new Date(agora.toLocaleString('en-US', { timeZone: 'America/Sao_Paulo' }));
}

// Função que calcula a rota atual e as passadas.
// Esta função é o "coração" da sua lógica.
function calcularStatusRotas() {
    const agora = getSaoPauloTime();
    let proximaRotaEncontrada = null;
    let historicoRotas = [];

    // Ordenar a programação por horário para garantir a lógica correta
    const programacaoOrdenada = [...programacao].sort((a, b) => a[0].localeCompare(b[0]));

    // Itera por todas as rotas programadas
    for (const rota of programacaoOrdenada) {
        const [hora, minuto] = rota[0].split(':');
        const horarioRotaHoje = getSaoPauloTime();
        horarioRotaHoje.setHours(parseInt(hora, 10), parseInt(minuto, 10), 0, 0);

        const nomeRota = rota[1];
        const horarioSaida = `Saída às ${rota[0]}`;

        if (horarioRotaHoje < agora) {
            // Se o horário da rota já passou, adiciona ao histórico
            historicoRotas.unshift({ nome: nomeRota, horario: horarioSaida });
        } else if (!proximaRotaEncontrada) {
            // Se ainda não achamos a próxima rota e esta é no futuro, ela é a próxima
            proximaRotaEncontrada = { nome: nomeRota, horario: horarioSaida };
        }
    }

    // Se todas as rotas já passaram hoje, a próxima será a primeira de "amanhã"
    if (!proximaRotaEncontrada && programacaoOrdenada.length > 0) {
        const primeiraRota = programacaoOrdenada[0];
        proximaRotaEncontrada = {
            nome: primeiraRota[1],
            horario: `Saída às ${primeiraRota[0]}`
        };
    }
    
    // Se não há programação, define um estado padrão
    if (!proximaRotaEncontrada) {
       proximaRotaEncontrada = { nome: 'Nenhuma rota programada.', horario: '' };
    }

    // Limita o histórico para os últimos 10
    if (historicoRotas.length > 10) {
        historicoRotas = historicoRotas.slice(0, 10);
    }
    
    return {
        proxima: proximaRotaEncontrada,
        passadas: historicoRotas
    };
}

// Serve os arquivos estáticos da pasta 'public' (se você tiver uma)
app.use(express.static('public'));

// CRIAÇÃO DO ENDPOINT DA API
// Quando o front-end chamar /api/status, este código será executado
app.get('/api/status', (req, res) => {
    const status = calcularStatusRotas();
    res.json(status); // Devolve os dados calculados como JSON
});

// A Vercel não usa o app.listen. Em vez disso, exportamos o app.
// Opcional: você pode manter o listen para testar localmente.
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Servidor rodando na porta ${PORT} para testes locais.`);
});

// ESSA LINHA É A MAIS IMPORTANTE PARA A VERCEL
module.exports = app;
