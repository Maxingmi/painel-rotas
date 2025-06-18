// server.js - Versão Final Corrigida

// Capturadores de erros fatais
process.on('uncaughtException', (err, origin) => {
    console.error(`\n\nFATAL ERROR - UNCAUGHT EXCEPTION!\n`);
    console.error(`Error:`, err);
    console.error(`Origin:`, origin);
});
process.on('unhandledRejection', (reason, promise) => {
    console.error(`\n\nFATAL ERROR - UNHANDLED REJECTION!\n`);
    console.error(`Reason:`, reason);
});

// ############# A CORREÇÃO ESTÁ AQUI #############
// Garantindo que TODAS as importações necessárias estão presentes
const express = require('express');
const http = require('http');
const { Server } = require("socket.io"); // Esta linha era a que estava faltando/incorreta
// ###############################################

const app = express();
const server = http.createServer(app);
const io = new Server(server); // Agora 'Server' é reconhecido

const PORT = process.env.PORT || 1000;

const programacao = [
    ['19:00', 'ROTA 069/072'],
    ['20:30', 'ROTA 039'],
    ['22:00', 'ROTA 068/081-043/049'],
    ['23:00', 'ROTA 029/055/026'],
    ['23:50', 'ROTA 030/086'],
    ['00:00', 'ROTA 035/037'],
    ['00:15', 'ROTA 045/076'],
    ['01:30', 'ROTA 007/036'],
    ['02:30', 'ROTA 064/066'],
    ['03:40', 'ROTA 044'],
    ['04:00', 'ROTA 033/038'],
    ['05:00', 'ROTA 006/034']
];

app.use(express.static('public'));

app.get('/health', (req, res) => {
  res.status(200).send('OK');
});

// O resto do seu código, que já estava bom
let rotaAtual = { nome: 'Aguardando...', horario: '' };
let rotasPassadas = [];
let horarioProximaRota = null;

function verificarProximaRota() {
    try {
        const agora = new Date();
        let proximaRotaEncontrada = null;
        horarioProximaRota = null;
        const programacaoOrdenada = [...programacao].sort((a, b) => a[0].localeCompare(b[0]));
        for (const rota of programacaoOrdenada) {
            const [hora, minuto] = rota[0].split(':');
            const horarioRotaHoje = new Date();
            horarioRotaHoje.setHours(hora, minuto, 0, 0);
            if (horarioRotaHoje >= agora) {
                proximaRotaEncontrada = { nome: rota[1], horario: `Saída às ${rota[0]}` };
                horarioProximaRota = horarioRotaHoje;
                break;
            }
        }
        if (horarioProximaRota === null && programacaoOrdenada.length > 0) {
            const primeiraRotaDoDia = programacaoOrdenada[0];
            const [hora, minuto] = primeiraRotaDoDia[0].split(':');
            const horarioRotaAmanha = new Date();
            horarioRotaAmanha.setDate(agora.getDate() + 1);
            horarioRotaAmanha.setHours(hora, minuto, 0, 0);
            proximaRotaEncontrada = { nome: primeiraRotaDoDia[1], horario: `Saída às ${primeiraRotaDoDia[0]}` };
            horarioProximaRota = horarioRotaAmanha;
            if (rotasPassadas.length > 0) {
                rotasPassadas = [];
            }
        }
        if (proximaRotaEncontrada === null) {
            proximaRotaEncontrada = { nome: 'Nenhuma rota na programação.', horario: '' };
        }
        const contagemMs = horarioProximaRota ? horarioProximaRota.getTime() - agora.getTime() : null;
        if (rotaAtual.nome !== proximaRotaEncontrada.nome) {
            if (!rotaAtual.nome.includes('Aguardando...') && !rotaAtual.nome.includes('Nenhuma rota')) {
                rotasPassadas.unshift(rotaAtual);
            }
            rotaAtual = proximaRotaEncontrada;
            console.log(`[ATUALIZAÇÃO DE ROTA] Próxima: ${rotaAtual.nome}`);
        }
        io.emit('atualizar-painel', {
            proxima: rotaAtual,
            passadas: rotasPassadas,
            contagemRegressiva: contagemMs
        });
    } catch (error) {
        console.error("ERRO na função verificarProximaRota:", error);
    }
}

io.on('connection', (socket) => {
    console.log('Um painel se conectou!');
    verificarProximaRota();
});

server.listen(PORT, () => {
    console.log(`Servidor rodando na porta ${PORT}.`);
    setInterval(verificarProximaRota, 1000);
});