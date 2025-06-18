// server.js - Versão com correção de fuso horário para Vercel

const express = require('express');
const app = express();

const programacao = [
    ['19:00', 'ROTA 069/072'], ['20:30', 'ROTA 039'], ['22:00', 'ROTA 068/081-043/049'],
    ['23:00', 'ROTA 029/055/026'], ['23:50', 'ROTA 030/086'], ['00:00', 'ROTA 035/037'],
    ['00:15', 'ROTA 045/076'], ['01:30', 'ROTA 007/036'], ['02:30', 'ROTA 064/066'],
    ['03:40', 'ROTA 044'], ['04:00', 'ROTA 033/038'], ['05:00', 'ROTA 006/034']
];

// Função que calcula a rota atual e as passadas.
function calcularStatusRotas() {
    // Pega a data e hora atual. Nos servidores da Vercel, isto será em UTC.
    const agora = new Date();

    // Para obter a data (dia, mês, ano) de hoje em São Paulo, usamos Intl.DateTimeFormat.
    // Isto evita erros de parsing de strings de data.
    const parts = new Intl.DateTimeFormat('en-CA', {
        timeZone: 'America/Sao_Paulo',
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
    }).formatToParts(agora);

    const ano = parts.find(p => p.type === 'year').value;
    const mes = parts.find(p => p.type === 'month').value;
    const dia = parts.find(p => p.type === 'day').value;
    
    // Constrói a data de hoje no formato YYYY-MM-DD
    const hojeEmSaoPaulo = `${ano}-${mes}-${dia}`;

    let proximaRotaEncontrada = null;
    let historicoRotas = [];

    // Ordenar a programação por horário para garantir a lógica correta
    const programacaoOrdenada = [...programacao].sort((a, b) => a[0].localeCompare(b[0]));

    for (const rota of programacaoOrdenada) {
        const horario = rota[0]; // ex: "19:00"
        const nomeRota = rota[1];
        const horarioSaida = `Saída às ${horario}`;
        
        // Cria uma data completa e fiável para o horário da rota de hoje em SP.
        // O formato 'YYYY-MM-DDTHH:mm:ss-03:00' especifica o fuso horário de São Paulo (UTC-3).
        const horarioRotaHoje = new Date(`${hojeEmSaoPaulo}T${horario}:00-03:00`);

        if (horarioRotaHoje < agora) {
            // Se o horário da rota já passou, adiciona ao histórico
            historicoRotas.unshift({ nome: nomeRota, horario: horarioSaida });
        } else if (!proximaRotaEncontrada) {
            // Se ainda não achamos a próxima rota e esta é no futuro, ela é a próxima
            proximaRotaEncontrada = { nome: nomeRota, horario: horarioSaida };
        }
    }
    
    // Se todas as rotas já passaram, a próxima é a primeira do array (a mais cedo).
    // A lógica de virada de dia está implícita aqui, pois `horarioRotaHoje` será sempre menor que `agora`.
    if (!proximaRotaEncontrada && programacaoOrdenada.length > 0) {
        const primeiraRota = programacaoOrdenada[0];
        proximaRotaEncontrada = {
            nome: primeiraRota[1],
            horario: `Saída às ${primeiraRota[0]}`
        };
    }
    
    // Caso de fallback se não houver nenhuma programação
    if (!proximaRotaEncontrada) {
       proximaRotaEncontrada = { nome: 'Nenhuma rota programada.', horario: '' };
    }

    // Limita o histórico para os últimos 10
    if (historicoRotas.length > 10) {
        historicoRotas = historicoRotas.slice(0, 10);
    }
    
    return {
        proxima: proximaRotaEncontrada,
        passadas: historicoRotas.reverse() // Invertemos para mostrar do mais antigo para o mais novo
    };
}


// Endpoint da API. Quando o frontend chamar /api/status, este código será executado.
app.get('/api/status', (req, res) => {
    try {
        const status = calcularStatusRotas();
        res.status(200).json(status);
    } catch (error) {
        // Se algo der errado, envia uma resposta de erro clara
        console.error("Erro ao calcular rotas:", error);
        res.status(500).json({ error: "Erro interno do servidor.", message: error.message });
    }
});


// Exportamos o app para a Vercel.
module.exports = app;
