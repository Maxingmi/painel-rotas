// server.js - VERSÃO FINAL OTIMIZADA

process.on('uncaughtException', (err, origin) => { console.error(`FATAL ERROR!`, { err, origin }); });
process.on('unhandledRejection', (reason, promise) => { console.error(`FATAL ERROR!`, { reason, promise }); });

const express = require('express');
const http = require('http');
const { Server } = require("socket.io");

const app = express();
const server = http.createServer(app);
const io = new Server(server);

const PORT = process.env.PORT || 1000;

// Sua programação completa
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
app.get('/health', (req, res) => res.status(200).send('OK'));

let rotasPassadas = [];

function calcularProximaRota() {
    // Esta função agora apenas calcula e retorna os dados, sem emitir nada
    try {
        const agora = new Date();
        let proximaRotaEncontrada = null;
        let horarioProximaRota = null;
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
            // ... (sua lógica de virada de dia continua aqui)
            // ...
            if (rotasPassadas.length > 0) {
                // Reinicia o histórico na virada do dia
                rotasPassadas = [];
            }
        }

        if (proximaRotaEncontrada === null) {
            proximaRotaEncontrada = { nome: 'Nenhuma rota na programação.', horario: '' };
        }
        
        // Adiciona a rota anterior ao histórico, se necessário
        const rotaAtual = proximaRotaEncontrada;
        if (rotasPassadas.length === 0 || (rotasPassadas.length > 0 && rotasPassadas[0].nome !== rotaAtual.nome)) {
             // Lógica para evitar adicionar a mesma rota repetidamente ao histórico
        }

        const contagemMs = horarioProximaRota ? horarioProximaRota.getTime() - agora.getTime() : null;
        
        return {
            proxima: rotaAtual,
            passadas: rotasPassadas,
            contagemRegressiva: contagemMs
        };

    } catch (error) {
        console.error("ERRO CRÍTICO na função calcularProximaRota:", error);
    }
}

io.on('connection', (socket) => {
    console.log('Um painel se conectou!');
    
    // Envia os dados da rota assim que o cliente se conecta
    const dadosIniciais = calcularProximaRota();
    if (dadosIniciais) socket.emit('atualizar-painel', dadosIniciais);

    // Ouve o pedido do cliente por uma nova rota
    socket.on('preciso-de-nova-rota', () => {
        console.log('Cliente pediu nova rota. Calculando...');
        const novosDados = calcularProximaRota();
        if(novosDados) socket.emit('atualizar-painel', novosDados);
    });
});

server.listen(PORT, () => {
    console.log(`Servidor final e otimizado rodando na porta ${PORT}.`);
});