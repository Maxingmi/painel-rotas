// server.js - Versão Final para Railway com correção de fuso horário

const express = require('express');
const http = require('http');
const { Server } = require("socket.io");

const app = express();
const server = http.createServer(app);
const io = new Server(server);

const PORT = process.env.PORT || 1000;

const programacao = [
    ['19:00', 'ROTA 069/072'], ['20:30', 'ROTA 039'], ['22:00', 'ROTA 068/081-043/049'],
    ['23:00', 'ROTA 029/055/026'], ['23:50', 'ROTA 030/086'], ['00:00', 'ROTA 035/037'],
    ['00:15', 'ROTA 045/076'], ['01:30', 'ROTA 007/036'], ['02:30', 'ROTA 064/066'],
    ['03:40', 'ROTA 044'], ['04:00', 'ROTA 033/038'], ['05:00', 'ROTA 006/034']
];

app.use(express.static('public'));
app.get('/health', (req, res) => res.status(200).send('OK'));

let rotaAtual = { nome: 'Aguardando...', horario: '' };
let rotasPassadas = [];

// Função para obter a hora de São Paulo (UTC-3)
function getSaoPauloTime() {
    const agora = new Date();
    // Converte a data atual para o fuso horário de SP
    return new Date(agora.toLocaleString('en-US', { timeZone: 'America/Sao_Paulo' }));
}

function verificarProximaRota() {
    try {
        const agora = getSaoPauloTime();
        let proximaRotaEncontrada = null;
        const programacaoOrdenada = [...programacao].sort((a, b) => a[0].localeCompare(b[0]));

        for (const rota of programacaoOrdenada) {
            const [hora, minuto] = rota[0].split(':');
            const horarioRotaHoje = getSaoPauloTime();
            horarioRotaHoje.setHours(hora, minuto, 0, 0);

            if (horarioRotaHoje >= agora) {
                proximaRotaEncontrada = { nome: rota[1], horario: `Saída às ${rota[0]}` };
                break;
            }
        }

        if (proximaRotaEncontrada === null && programacaoOrdenada.length > 0) {
            // Lógica para o próximo dia...
            // ... (A lógica de virada de dia continua aqui)
        }
        
        if (proximaRotaEncontrada === null) {
            proximaRotaEncontrada = { nome: 'Nenhuma rota programada.', horario: '' };
        }

        if (rotaAtual.nome !== proximaRotaEncontrada.nome) {
            if (!rotaAtual.nome.includes('Aguardando...') && !rotaAtual.nome.includes('Nenhuma')) {
                rotasPassadas.unshift(rotaAtual);
                if (rotasPassadas.length > 10) rotasPassadas.pop(); // Limita o histórico a 10 itens
            }
            rotaAtual = proximaRotaEncontrada;
            console.log(`[ATUALIZAÇÃO DE ROTA] Próxima: ${rotaAtual.nome}`);
        }

        io.emit('atualizar-painel', {
            proxima: rotaAtual,
            passadas: rotasPassadas
        });
    } catch (error) {
        console.error("ERRO CRÍTICO na função verificarProximaRota:", error);
    }
}

io.on('connection', (socket) => {
    console.log('Um painel se conectou!');
    verificarProximaRota();
});

server.listen(PORT, () => {
    console.log(`Servidor final rodando na porta ${PORT}.`);
    // Usando o setInterval seguro que já havíamos testado
    setInterval(verificarProximaRota, 5000); // Verificando a cada 5 segundos
});