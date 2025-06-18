// /api/status.js - Versão para Vercel Serverless e com lógica de data robusta

// Importa a biblioteca para lidar com fusos horários de forma segura
import { zonedTimeToUtc, utcToZonedTime, format } from 'date-fns-tz';

const programacao = [
    ['19:00', 'ROTA 069/072'], ['20:30', 'ROTA 039'], ['22:00', 'ROTA 068/081-043/049'],
    ['23:00', 'ROTA 029/055/026'], ['23:50', 'ROTA 030/086'], ['00:00', 'ROTA 035/037'],
    ['00:15', 'ROTA 045/076'], ['01:30', 'ROTA 007/036'], ['02:30', 'ROTA 064/066'],
    ['03:40', 'ROTA 044'], ['04:00', 'ROTA 033/038'], ['05:00', 'ROTA 006/034']
];

// A função principal da nossa API
export default function handler(req, res) {
    try {
        const timeZone = 'America/Sao_Paulo';
        const agoraEmSaoPaulo = utcToZonedTime(new Date(), timeZone);

        let proximasOcorrencias = [];
        let historicoRotas = [];

        programacao.forEach(([horario, nomeRota]) => {
            const [horas, minutos] = horario.split(':').map(Number);
            
            // Cria a data da rota para "hoje" no fuso de São Paulo
            let dataRotaHoje = new Date(
                agoraEmSaoPaulo.getFullYear(),
                agoraEmSaoPaulo.getMonth(),
                agoraEmSaoPaulo.getDate(),
                horas,
                minutos
            );
            // Converte essa data local para o fuso horário correto
            let dataRotaHojeComFuso = zonedTimeToUtc(dataRotaHoje, timeZone);

            let proximaOcorrencia;

            // Se o horário da rota hoje já passou
            if (dataRotaHojeComFuso < agoraEmSaoPaulo) {
                // A próxima ocorrência é amanhã
                const dataRotaAmanha = new Date(dataRotaHojeComFuso);
                dataRotaAmanha.setDate(dataRotaAmanha.getDate() + 1);
                proximaOcorrencia = dataRotaAmanha;
                
                historicoRotas.push({ nome: nomeRota, horario: `Saída às ${horario}` });
            } else {
                // Se não, a próxima ocorrência é hoje
                proximaOcorrencia = dataRotaHojeComFuso;
            }

            proximasOcorrencias.push({
                data: proximaOcorrencia,
                nome: nomeRota,
                horario: `Saída às ${horario}`
            });
        });

        // Ordena para achar a próxima rota
        proximasOcorrencias.sort((a, b) => a.data - b.data);

        const proximaRotaEncontrada = {
            nome: proximasOcorrencias[0].nome,
            horario: proximasOcorrencias[0].horario
        };

        // Ordena o histórico pelo horário (da forma que estava antes, está ok)
        historicoRotas.sort((a, b) => {
            const timeA = a.horario.split(' às ')[1];
            const timeB = b.horario.split(' às ')[1];
            return timeA.localeCompare(timeB);
        });

        res.status(200).json({
            proxima: proximaRotaEncontrada,
            passadas: historicoRotas
        });

    } catch (error) {
        console.error("Erro na API /api/status:", error);
        res.status(500).json({ error: "Erro interno do servidor.", message: error.message });
    }
}