process.env.NODE_ENV = 'test';
process.env.AI_PROVIDER = 'heuristic';

const request = require('supertest');
const { app, pool, server, io } = require('../index');

describe('AI endpoints', () => {
    afterEach(() => {
        jest.restoreAllMocks();
    });

    afterAll((done) => {
        try {
            io.close();
            server.close(() => done());
        } catch (error) {
            done();
        }
    });

    test('explains formula using fallback engine', async () => {
        const querySpy = jest.spyOn(pool, 'query').mockImplementation(async (sql) => {
            if (sql.includes('SELECT firebase_uid, email, role FROM users')) {
                return { rows: [{ firebase_uid: 'user-ai-1', email: 'ai1@test.com', role: 'user' }] };
            }
            if (sql.includes('INSERT INTO ai_usage_logs')) {
                return { rows: [] };
            }
            throw new Error(`Unexpected query: ${sql}`);
        });

        const response = await request(app)
            .post('/api/ai/explain-formula')
            .send({ requester_id: 'user-ai-1', formula: '=SUM(A1:A10)' });

        expect(response.status).toBe(200);
        expect(response.body.explanation).toContain('SUM');
        expect(response.body.provider).toBeDefined();
        expect(querySpy).toHaveBeenCalled();
    }, 10000);

    test('detects workbook errors', async () => {
        const querySpy = jest.spyOn(pool, 'query').mockImplementation(async (sql) => {
            if (sql.includes('SELECT firebase_uid, email, role FROM users')) {
                return { rows: [{ firebase_uid: 'user-ai-2', email: 'ai2@test.com', role: 'user' }] };
            }
            if (sql.includes('FROM workbooks w')) {
                return { rows: [{ id: 77, name: 'AI WB', owner_id: 'user-ai-2', is_collaborator: false }] };
            }
            if (sql.includes('FROM cells c') && sql.includes('JOIN worksheets ws')) {
                return {
                    rows: [
                        { address: 'A1', value: '#DIV/0!', formula: '=10/0', worksheet_name: 'Sheet1' },
                        { address: 'B2', value: '42', formula: null, worksheet_name: 'Sheet1' },
                    ],
                };
            }
            if (sql.includes('INSERT INTO ai_usage_logs')) {
                return { rows: [] };
            }
            throw new Error(`Unexpected query: ${sql}`);
        });

        const response = await request(app)
            .post('/api/ai/detect-errors')
            .send({ requester_id: 'user-ai-2', workbook_id: 77 });

        expect(response.status).toBe(200);
        expect(response.body.totalIssues).toBeGreaterThan(0);
        expect(response.body.findings[0].errorType).toBe('#DIV/0!');
        expect(querySpy).toHaveBeenCalled();
    });

    test('analyzes workbook numeric data', async () => {
        const querySpy = jest.spyOn(pool, 'query').mockImplementation(async (sql) => {
            if (sql.includes('SELECT firebase_uid, email, role FROM users')) {
                return { rows: [{ firebase_uid: 'user-ai-3', email: 'ai3@test.com', role: 'user' }] };
            }
            if (sql.includes('FROM workbooks w')) {
                return { rows: [{ id: 78, name: 'Stats WB', owner_id: 'user-ai-3', is_collaborator: false }] };
            }
            if (sql.includes('FROM cells c') && sql.includes('JOIN worksheets ws')) {
                return {
                    rows: [
                        { address: 'A1', value: '10', worksheet_name: 'Sheet1' },
                        { address: 'A2', value: '20', worksheet_name: 'Sheet1' },
                        { address: 'A3', value: '30', worksheet_name: 'Sheet1' },
                    ],
                };
            }
            if (sql.includes('INSERT INTO ai_usage_logs')) {
                return { rows: [] };
            }
            throw new Error(`Unexpected query: ${sql}`);
        });

        const response = await request(app)
            .post('/api/ai/analyze-data')
            .send({ requester_id: 'user-ai-3', workbook_id: 78 });

        expect(response.status).toBe(200);
        expect(response.body.stats).toBeDefined();
        expect(response.body.stats.count).toBe(3);
        expect(response.body.summary).toContain('Analyzed');
        expect(querySpy).toHaveBeenCalled();
    }, 10000);

    test('answers prompt with selected range context', async () => {
        const querySpy = jest.spyOn(pool, 'query').mockImplementation(async (sql, params = []) => {
            if (sql.includes('SELECT firebase_uid, email, role FROM users')) {
                return { rows: [{ firebase_uid: 'user-ai-4', email: 'ai4@test.com', role: 'user' }] };
            }
            if (sql.includes('FROM workbooks w')) {
                return { rows: [{ id: 79, name: 'Prompt WB', owner_id: 'user-ai-4', is_collaborator: false }] };
            }
            if (sql.includes('FROM cells') && sql.includes('row_idx BETWEEN')) {
                if (params[0] === 12 && params[1] === 0) {
                    return {
                        rows: [
                            { address: 'A1', value: 'Sales', formula: null },
                            { address: 'A2', value: '1200', formula: null },
                            { address: 'A3', value: '1500', formula: null },
                        ],
                    };
                }
                return { rows: [] };
            }
            if (sql.includes('INSERT INTO ai_usage_logs')) {
                return { rows: [] };
            }
            throw new Error(`Unexpected query: ${sql}`);
        });

        const response = await request(app)
            .post('/api/ai/prompt')
            .send({
                requester_id: 'user-ai-4',
                workbook_id: 79,
                worksheet_id: 12,
                prompt: 'Summarize this selected range',
                selection: { row: 0, col: 0, rowCount: 3, colCount: 1 },
            });

        expect(response.status).toBe(200);
        expect(response.body.prompt).toBe('Summarize this selected range');
        expect(typeof response.body.answer).toBe('string');
        expect(response.body.selectedCellsCount).toBeGreaterThan(0);
        expect(querySpy).toHaveBeenCalled();
    }, 10000);
});
