const io = require('socket.io-client');

const SOCKET_SERVER_URL = 'http://localhost:5000';
const WORKBOOK_ID = '4';

// User 1 connect
const socket1 = io(SOCKET_SERVER_URL);
// User 2 connect
const socket2 = io(SOCKET_SERVER_URL);

socket1.on('connect', () => {
    console.log('Socket 1 connected');
    socket1.emit('join-workbook', { workbookId: WORKBOOK_ID, userId: 'bot-1', userName: 'Bot User 1' });

    // Listen for conflict resolution broadcast
    socket1.on('cell-conflict', (data) => {
        console.log('--- CONFLICT DETECTED ---');
        console.log(data);
    });
});

socket2.on('connect', () => {
    console.log('Socket 2 connected');
    socket2.emit('join-workbook', { workbookId: WORKBOOK_ID, userId: 'bot-2', userName: 'Bot User 2' });
});

let runCount = 0;
setInterval(() => {
    runCount++;
    console.log(`[Run ${runCount}] Socket 1 editing C3...`);
    socket1.emit('cell-edit', {
        workbookId: WORKBOOK_ID,
        cellData: {
            worksheetId: 'sheet-01',
            row: 2, // 2 = 3rd row (0-indexed)
            col: 2, // 2 = C
            value: `Value from Bot 1 (run ${runCount})`,
            formula: ''
        }
    });

    // 500ms later, Socket 2 edits the exact same cell
    setTimeout(() => {
        console.log(`[Run ${runCount}] Socket 2 editing C3 (causing conflict)`);
        socket2.emit('cell-edit', {
            workbookId: WORKBOOK_ID,
            cellData: {
                worksheetId: 'sheet-01',
                row: 2,
                col: 2,
                value: `Value from Bot 2 (run ${runCount})`,
                formula: ''
            }
        });
    }, 500);

}, 5000); // Repeat every 5 seconds
