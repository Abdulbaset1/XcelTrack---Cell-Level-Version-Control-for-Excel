import React from 'react';

interface CollaborativeCursor {
    userId: string;
    userName: string;
    color: string;
    cellReference: string;
    position: { x: number; y: number };
}

interface CollaborativeCursorsProps {
    cursors: CollaborativeCursor[];
}

const CollaborativeCursors: React.FC<CollaborativeCursorsProps> = ({ cursors }) => {
    return (
        <>
            {cursors.map((cursor) => (
                <div
                    key={cursor.userId}
                    className="absolute pointer-events-none z-50 transition-all duration-100"
                    style={{
                        left: `${cursor.position.x}px`,
                        top: `${cursor.position.y}px`,
                    }}
                >
                    {/* Cursor Arrow */}
                    <svg
                        width="20"
                        height="20"
                        viewBox="0 0 20 20"
                        fill="none"
                        xmlns="http://www.w3.org/2000/svg"
                    >
                        <path
                            d="M2 2L18 10L10 12L8 18L2 2Z"
                            fill={cursor.color}
                            stroke="white"
                            strokeWidth="1"
                        />
                    </svg>

                    {/* User Label */}
                    <div
                        className="absolute top-5 left-5 px-2 py-1 rounded text-white text-xs font-medium whitespace-nowrap shadow-lg"
                        style={{ backgroundColor: cursor.color }}
                    >
                        {cursor.userName}
                        <div className="absolute -top-1 -left-1 w-2 h-2 rounded-full bg-white animate-ping"></div>
                    </div>
                </div>
            ))}
        </>
    );
};

export default CollaborativeCursors;
