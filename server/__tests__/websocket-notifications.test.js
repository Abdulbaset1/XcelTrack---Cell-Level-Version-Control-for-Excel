const { initWebSocket } = require('../websocketServer');
const { logger } = require('../logger');

describe('WebSocket notification channels', () => {
    beforeAll(() => {
        jest.spyOn(logger, 'info').mockImplementation(() => {});
        jest.spyOn(logger, 'warn').mockImplementation(() => {});
        jest.spyOn(logger, 'error').mockImplementation(() => {});
    });

    afterAll(() => {
        jest.restoreAllMocks();
    });

    test('joins and leaves user notification channel', () => {
        const handlers = {};

        const mockSocket = {
            id: 'socket-1',
            join: jest.fn(),
            leave: jest.fn(),
            on: jest.fn((event, callback) => {
                handlers[event] = callback;
            }),
            to: jest.fn(() => ({ emit: jest.fn() })),
            emit: jest.fn(),
            handshake: { auth: {} },
        };

        const mockIo = {
            on: jest.fn((event, callback) => {
                if (event === 'connection') callback(mockSocket);
            }),
            to: jest.fn(() => ({ emit: jest.fn() })),
        };

        const mockPool = { query: jest.fn() };

        initWebSocket(mockIo, mockPool);

        expect(handlers['join-user-channel']).toBeDefined();
        expect(handlers['leave-user-channel']).toBeDefined();

        handlers['join-user-channel']({ userId: 'user-77' });
        handlers['leave-user-channel']({ userId: 'user-77' });

        expect(mockSocket.join).toHaveBeenCalledWith('user-user-77');
        expect(mockSocket.leave).toHaveBeenCalledWith('user-user-77');
    });

    test('ignores empty user id for channel join/leave', () => {
        const handlers = {};

        const mockSocket = {
            id: 'socket-2',
            join: jest.fn(),
            leave: jest.fn(),
            on: jest.fn((event, callback) => {
                handlers[event] = callback;
            }),
            to: jest.fn(() => ({ emit: jest.fn() })),
            emit: jest.fn(),
            handshake: { auth: {} },
        };

        const mockIo = {
            on: jest.fn((event, callback) => {
                if (event === 'connection') callback(mockSocket);
            }),
            to: jest.fn(() => ({ emit: jest.fn() })),
        };

        const mockPool = { query: jest.fn() };

        initWebSocket(mockIo, mockPool);

        handlers['join-user-channel']({});
        handlers['leave-user-channel']({});

        expect(mockSocket.join).not.toHaveBeenCalled();
        expect(mockSocket.leave).not.toHaveBeenCalled();
    });
});
