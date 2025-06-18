// server.js - Versão com correção de fuso horário e lógica de virada de dia

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
    // Pega a data e hora atual em UTC, como na Vercel.
    const agoraUTC = new Date();

    // Cria um objeto de data que reflete a hora exata em São Paulo.
    // É mais confiável do que construir strings de data manualmente.
    const agoraSP = new Date(agoraUTC.toLocaleString('en-US', { timeZone: 'America/Sao_Paulo' }));
    
    // Pega o dia, mês e ano de São Paulo de forma segura.
    const ano = agoraSP.getFullYear();
    const mes = agoraSP.getMonth(); // 0-11
    const dia = agoraSP.getDate();

    let proximasOcorrencias = [];
    let historicoRotas = [];

    // Para cada rota na programação, calculamos sua próxima data/hora de ocorrência.
    for (const rota of programacao) {
        const [horario, nomeRota] = rota;
        const [horas, minutos] = horario.split(':').map(Number);

        // Cria a data da rota para o dia de HOJE em São Paulo.
        const dataRotaHoje = new Date(ano, mes, dia, horas, minutos);

        let proximaOcorrencia;

        // ALTERAÇÃO PRINCIPAL: Lógica da virada do dia
        // Se a data/hora da rota HOJE já passou em comparação com o agora,
        // a próxima ocorrência dela é AMANHÃ.
        if (dataRotaHoje < agoraSP) {
            const dataRotaAmanha = new Date(dataRotaHoje);
            dataRotaAmanha.setDate(dataRotaAmanha.getDate() + 1); // Adiciona 1 dia
            proximaOcorrencia = dataRotaAmanha;
            
            // Se já passou, adicionamos ao histórico.
            historicoRotas.push({ nome: nomeRota, horario: `Saída às ${horario}` });

        } else {
            // Se ainda não passou hoje, a próxima ocorrência é hoje mesmo.
            proximaOcorrencia = dataRotaHoje;
        }

        proximasOcorrencias.push({
            data: proximaOcorrencia,
            nome: nomeRota,
            horario: `Saída às ${horario}`
        });
    }

    // Se não houver rotas, retorna um estado padrão.
    if (proximasOcorrencias.length === 0) {
        return {
            proxima: { nome: 'Nenhuma rota programada.', horario: '' },
            passadas: []
        };
    }
    
    // Ordena as próximas ocorrências pela data para encontrar a mais próxima.
    proximasOcorrencias.sort((a, b) => a.data - b.data);
    
    // A próxima rota é a primeira da lista ordenada.
    const proximaRotaEncontrada = {
        nome: proximasOcorrencias[0].nome,
        horario: proximasOcorrencias[0].horario
    };

    // Ordena o histórico pelo horário (opcional, mas bom para consistência)
    historicoRotas.sort((a, b) => a.horario.localeCompare(b.horario));
    
    // Limita o histórico para os últimos 10
    if (historicoRotas.length > 10) {
        historicoRotas = historicoRotas.slice(-10);
    }
    
    return {
        proxima: proximaRotaEncontrada,
        passadas: historicoRotas
    };
}


// Endpoint da API.
app.get('/api/status', (req, res) => {
    try {
        const status = calcularStatusRotas();
        res.status(200).json(status);
    } catch (error) {
        console.error("Erro ao calcular rotas:", error);
        res.status(500).json({ error: "Erro interno do servidor.", message: error.message });
    }
});

// Exportamos o app para a Vercel.
module.exports = app;