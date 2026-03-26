import React, { createContext, useContext, useEffect, useState, useRef, useCallback } from 'react';
import { io, Socket } from 'socket.io-client';

interface CollaborativeUser {
    socketId: string;
    userId: string;
    userName: string;
    color: string;
}

interface CursorPosition {
    socketId: string;
    position: {
        row: number;
        col: number;
        worksheetId: string;
    };
}

interface CellEdit {
    socketId: string;
    cellData: {
        row: number;
        col: number;
        value: string;
        formula?: string;
        worksheetId: string;
    };
}

export interface CellConflict {
    conflictId: number;   // ID from DB
    cell: string;         // e.g. "worksheetId:row:col"
    cellData: any;        // { row, col, value, formula, worksheetId }
    user: CollaborativeUser | null;
    conflictingUser: CollaborativeUser | null;
    conflictingValue: string; // The value that caused the conflict
    serverDetected: boolean;
}

interface TypingEvent {
    cell: string;
    user: CollaborativeUser | null;
}

interface WebSocketContextType {
    socket: Socket | null;
    isConnected: boolean;
    activeUsers: CollaborativeUser[];
    cursors: Map<string, CursorPosition>;
    typingUsers: Map<string, TypingEvent>;   // cell -> user typing there
    joinWorkbook: (workbookId: number, userId: string, userName: string) => void;
    leaveWorkbook: (workbookId: number, userId: string) => void;
    sendCursorMove: (workbookId: number, position: { row: number; col: number; worksheetId: string }) => void;
    sendCellEdit: (workbookId: number, cellData: any) => void;
    sendTyping: (workbookId: number, cell: string) => void;
    sendStopTyping: (workbookId: number, cell: string) => void;
    resolveConflict: (conflictId: number, resolution: string, resolvedValue: string, resolvedBy: string, workbookId: number, cellData: any) => void;
    onCellChange: (callback: (data: CellEdit) => void) => void;
    onConflict: (callback: (data: CellConflict) => void) => void;
    onConflictResolved: (callback: (data: any) => void) => void;
}

const WebSocketContext = createContext<WebSocketContextType | undefined>(undefined);

export const useWebSocket = () => {
    const context = useContext(WebSocketContext);
    if (!context) {
        throw new Error('useWebSocket must be used within WebSocketProvider');
    }
    return context;
};

interface WebSocketProviderProps {
    children: React.ReactNode;
    serverUrl?: string;
}

export const WebSocketProvider: React.FC<WebSocketProviderProps> = ({
    children,
    serverUrl = 'http://localhost:5000',
}) => {
    const [socket, setSocket] = useState<Socket | null>(null);
    const [isConnected, setIsConnected] = useState(false);
    const [activeUsers, setActiveUsers] = useState<CollaborativeUser[]>([]);
    const [cursors, setCursors] = useState<Map<string, CursorPosition>>(new Map());
    const [typingUsers, setTypingUsers] = useState<Map<string, TypingEvent>>(new Map());

    const cellChangeCallbackRef = useRef<((data: CellEdit) => void) | null>(null);
    const conflictCallbackRef = useRef<((data: CellConflict) => void) | null>(null);
    const conflictResolvedCallbackRef = useRef<((data: any) => void) | null>(null);

    useEffect(() => {
        const newSocket = io(serverUrl);

        newSocket.on('connect', () => {
            console.log('WebSocket connected');
            setIsConnected(true);
        });

        newSocket.on('disconnect', () => {
            console.log('WebSocket disconnected');
            setIsConnected(false);
        });

        // ── Presence Events ────────────────────────────────────────────────
        newSocket.on('user-joined', (user: CollaborativeUser) => {
            console.log('User joined:', user);
            setActiveUsers((prev) => [...prev, user]);
        });

        newSocket.on('user-left', ({ socketId, userId }: { socketId: string; userId: string }) => {
            console.log('User left:', userId);
            setActiveUsers((prev) => prev.filter((u) => u.socketId !== socketId));
            setCursors((prev) => {
                const next = new Map(prev);
                next.delete(socketId);
                return next;
            });
        });

        newSocket.on('current-users', (users: CollaborativeUser[]) => {
            console.log('Current users:', users);
            setActiveUsers(users.filter((u) => u.socketId !== newSocket.id));
        });

        // ── Cursor Events ──────────────────────────────────────────────────
        newSocket.on('cursor-update', (data: CursorPosition) => {
            setCursors((prev) => {
                const next = new Map(prev);
                next.set(data.socketId, data);
                return next;
            });
        });

        // ── Cell Edit (no conflict) ────────────────────────────────────────
        newSocket.on('cell-changed', (data: CellEdit) => {
            console.log('Cell changed by another user:', data);
            if (cellChangeCallbackRef.current) {
                cellChangeCallbackRef.current(data);
            }
        });

        // ── Typing Indicators ──────────────────────────────────────────────
        newSocket.on('typing', ({ cell, user }: TypingEvent) => {
            setTypingUsers((prev) => {
                const next = new Map(prev);
                next.set(cell, { cell, user });
                return next;
            });
        });

        newSocket.on('stop-typing', ({ cell }: { cell: string }) => {
            setTypingUsers((prev) => {
                const next = new Map(prev);
                next.delete(cell);
                return next;
            });
        });

        // ── Conflict Events ────────────────────────────────────────────────
        newSocket.on('cell-conflict', (data: CellConflict) => {
            console.warn('Cell conflict detected:', data);
            if (conflictCallbackRef.current) {
                conflictCallbackRef.current(data);
            }
        });

        newSocket.on('conflict-resolved', (data: any) => {
            console.log('Conflict resolved:', data);
            if (conflictResolvedCallbackRef.current) {
                conflictResolvedCallbackRef.current(data);
            }
        });

        setSocket(newSocket);

        return () => {
            newSocket.close();
        };
    }, [serverUrl]);

    // ── Emitters ───────────────────────────────────────────────────────────
    const joinWorkbook = useCallback((workbookId: number, userId: string, userName: string) => {
        if (socket) socket.emit('join-workbook', { workbookId, userId, userName });
    }, [socket]);

    const leaveWorkbook = useCallback((workbookId: number, userId: string) => {
        if (socket) socket.emit('leave-workbook', { workbookId, userId });
    }, [socket]);

    const sendCursorMove = useCallback((workbookId: number, position: { row: number; col: number; worksheetId: string }) => {
        if (socket) socket.emit('cursor-move', { workbookId, position });
    }, [socket]);

    const sendCellEdit = useCallback((workbookId: number, cellData: any) => {
        if (socket) socket.emit('cell-edit', { workbookId, cellData });
    }, [socket]);

    const sendTyping = useCallback((workbookId: number, cell: string) => {
        if (socket) socket.emit('typing', { workbookId, cell });
    }, [socket]);

    const sendStopTyping = useCallback((workbookId: number, cell: string) => {
        if (socket) socket.emit('stop-typing', { workbookId, cell });
    }, [socket]);

    const resolveConflict = useCallback((conflictId: number, resolution: string, resolvedValue: string, resolvedBy: string, workbookId: number, cellData: any) => {
        if (socket) socket.emit('resolve-conflict', { conflictId, resolution, resolvedValue, resolvedBy, workbookId, cellData });
    }, [socket]);

    // ── Callback Registrars ────────────────────────────────────────────────
    const onCellChange = useCallback((callback: (data: CellEdit) => void) => {
        cellChangeCallbackRef.current = callback;
    }, []);

    const onConflict = useCallback((callback: (data: CellConflict) => void) => {
        conflictCallbackRef.current = callback;
    }, []);

    const onConflictResolved = useCallback((callback: (data: any) => void) => {
        conflictResolvedCallbackRef.current = callback;
    }, []);

    return (
        <WebSocketContext.Provider
            value={{
                socket,
                isConnected,
                activeUsers,
                cursors,
                typingUsers,
                joinWorkbook,
                leaveWorkbook,
                sendCursorMove,
                sendCellEdit,
                sendTyping,
                sendStopTyping,
                resolveConflict,
                onCellChange,
                onConflict,
                onConflictResolved,
            }}
        >
            {children}
        </WebSocketContext.Provider>
    );
};
