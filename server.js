// server.js - Teste de Isolamento (desativando o loop)

// Capturadores de erros fatais
process.on('uncaughtException', (err, origin) => { console.error(`FATAL ERROR - UNCAUGHT EXCEPTION!`, { err, origin }); });
process.on('unhandledRejection', (reason, promise) => { console.error(`FATAL ERROR - UNHANDLED REJECTION!`, { reason, promise }); });

const express = require('express');
const http = require('http');
const { Server } = require("socket.io");

const app = express();
const server = http.createServer(app);
const io = new Server(server);

const PORT = process.env.PORT || 1000;

const programacao = [ /* Sua programação aqui... */ ];

app.use(express.static('public'));

app.get('/health', (req, res) => {
  res.status(200).send('OK');
});

// A função existe, mas não será chamada em loop
function verificarProximaRota() {
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
        let rotaAtual = proximaRotaEncontrada;
        
        io.emit('atualizar-painel', {
            proxima: rotaAtual,
            passadas: [],
            contagemRegressiva: contagemMs
        });
    } catch (error) {
        console.error("ERRO CRÍTICO na função verificarProximaRota:", error);
    }
}

io.on('connection', (socket) => {
    console.log('Um painel se conectou!');
    // A função roda uma vez quando o usuário conecta
    verificarProximaRota();
});

server.listen(PORT, () => {
    console.log(`>>> SERVIDOR COMPLETO (TESTE SEM INTERVAL) rodando na porta ${PORT}.`);
    // ############# A MUDANÇA ESTÁ AQUI #############
    // A linha abaixo foi desativada para este teste.
    // setInterval(verificarProximaRota, 2000); 
    // ##############################################
});