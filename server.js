// server.js

const express = require('express');
const http = require('http');
const { Server } = require("socket.io");

const app = express();
const server = http.createServer(app);
const io = new Server(server);

const PORT = 3000;

// Onde a programação de rotas fica
const programacao = [
    ['08:39', 'ROTA 101'],
    ['08:45', 'ROTA 205'],
    ['09:00', 'ROTA 102 - MERCADO SUL'],
    ['11:30', 'ROTA 310'],
    ['13:00', 'ROTA 415 - CENTRO'],
    ['14:45', 'ROTA 206'],
    ['16:00', 'ROTA 501 - ZONA OESTE'],
    ['17:30', 'ROTA 311']
];

app.use(express.static('public'));

// ############# O QUE MUDOU #############
// Agora temos duas variáveis para guardar o estado
let rotaAtual = { nome: 'Aguardando...', horario: '' }; // Guarda a rota principal
let rotasPassadas = []; // Guarda a lista de histórico
// #########################################

function verificarProximaRota() {
    const agora = new Date();
    // Valor padrão caso nenhuma rota futura seja encontrada
    let proximaRotaEncontrada = { nome: 'Rotas do dia finalizadas.', horario: '' };

    for (const rota of programacao) {
        const [hora, minuto] = rota[0].split(':');
        const horarioRota = new Date();
        horarioRota.setHours(hora, minuto, 0, 0);

        if (horarioRota >= agora) {
            proximaRotaEncontrada = { nome: rota[1], horario: `Saída às ${rota[0]}` };
            break;
        }
    }
    
    // ############# O QUE MUDOU #############
    // Verifica se a rota principal mudou
    if (rotaAtual.nome !== proximaRotaEncontrada.nome) {
        // Se a rotaAtual não for a mensagem inicial, adiciona ao histórico
        if (!rotaAtual.nome.includes('Aguardando...')) {
            // Adiciona no início da lista para a mais recente ficar no topo
            rotasPassadas.unshift(rotaAtual); 
        }

        // Atualiza a rota principal
        rotaAtual = proximaRotaEncontrada;
        console.log(`[ATUALIZAÇÃO] Próxima Rota: ${rotaAtual.nome}. Histórico agora tem ${rotasPassadas.length} itens.`);
        
        // Envia o objeto COMPLETO (próxima rota E histórico) para o painel
        io.emit('atualizar-painel', {
            proxima: rotaAtual,
            passadas: rotasPassadas
        });
    }
    // #########################################
}

io.on('connection', (socket) => {
    console.log('Um painel se conectou!');
    // ############# O QUE MUDOU #############
    // Envia o estado completo para o novo painel não ficar dessincronizado
    socket.emit('atualizar-painel', {
        proxima: rotaAtual,
        passadas: rotasPassadas
    });
    // #########################################
});

server.listen(PORT, () => {
    console.log(`Servidor rodando na porta ${PORT}. Abra http://localhost:3000 no seu navegador.`);
    setInterval(verificarProximaRota, 1000); 
});