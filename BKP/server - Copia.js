// server.js

// Importando as bibliotecas necessárias
const express = require('express');
const http = require('http');
const { Server } = require("socket.io");

const app = express();
const server = http.createServer(app);
const io = new Server(server);

const PORT = 3000; // A porta onde nosso servidor vai rodar

// #############################################################
// ## AQUI VOCÊ EDITA A SUA PROGRAMAÇÃO DE ROTAS DO DIA ##
// ## Formato: ['HH:MM', 'NOME OU NÚMERO DA ROTA'] ##
// #############################################################
const programacao = [
    ['08:34', 'ROTA 101'],
    ['09:15', 'ROTA 205'],
    ['10:00', 'ROTA 102 - MERCADO SUL'],
    ['11:30', 'ROTA 310'],
    ['13:00', 'ROTA 415 - CENTRO'],
    ['14:45', 'ROTA 206'],
    ['16:00', 'ROTA 501 - ZONA OESTE'],
    ['17:30', 'ROTA 311']
    // Adicione mais rotas aqui se precisar
];
// #############################################################

// Diz ao Express para usar a pasta 'public' para servir arquivos estáticos (nosso HTML)
app.use(express.static('public'));

let rotaAtual = null; // Variável para guardar a rota que está sendo exibida

// Função que verifica qual rota deve ser exibida agora
function verificarProximaRota() {
    const agora = new Date();
    let proximaRotaEncontrada = { nome: 'Aguardando próxima rota...', horario: '' }; // Mensagem padrão

    for (const rota of programacao) {
        const [hora, minuto] = rota[0].split(':');
        const horarioRota = new Date();
        horarioRota.setHours(hora, minuto, 0, 0);

        if (horarioRota >= agora) {
            proximaRotaEncontrada = { nome: rota[1], horario: `Saída às ${rota[0]}` };
            break;
        }
    }
    
    // Se não encontrou nenhuma, significa que todas já passaram
    if (!proximaRotaEncontrada.horario) {
        proximaRotaEncontrada = { nome: 'Rotas do dia finalizadas.', horario: '' };
    }

    // O mais importante: só envia a atualização se a rota mudou!
    if (rotaAtual !== proximaRotaEncontrada.nome) {
        rotaAtual = proximaRotaEncontrada.nome;
        console.log(`[ATUALIZAÇÃO] Enviando nova rota para o painel: ${rotaAtual}`);
        io.emit('atualizar-painel', proximaRotaEncontrada); // Envia para TODOS os painéis conectados
    }
}

// Quando um novo painel (navegador) se conectar
io.on('connection', (socket) => {
    console.log('Um painel se conectou!');
    // Envia imediatamente a rota atual para o novo painel não ficar em branco
    verificarProximaRota(); 
});

// Inicia o servidor e o verificador
server.listen(PORT, () => {
    console.log(`Servidor rodando na porta ${PORT}. Abra http://localhost:3000 no seu navegador.`);
    // Roda a verificação a cada segundo
    setInterval(verificarProximaRota, 1000);
});