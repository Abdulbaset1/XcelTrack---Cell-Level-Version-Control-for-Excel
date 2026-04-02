process.env.NODE_ENV = 'test';

const request = require('supertest');
const { app, pool, server, io } = require('../index');

describe('API missing features coverage', () => {
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

    test('supports pagination on GET /api/workbooks', async () => {
        const querySpy = jest.spyOn(pool, 'query').mockImplementation(async (sql) => {
            if (sql.includes('SELECT firebase_uid, email, role FROM users')) {
                return { rows: [{ firebase_uid: 'owner-1', email: 'owner@test.com', role: 'user' }] };
            }

            if (sql.includes('FROM workbooks w') && sql.includes('LIMIT $2 OFFSET $3')) {
                return {
                    rows: [{ id: 1, name: 'Book.xlsx', owner_id: 'owner-1' }],
                };
            }

            throw new Error(`Unexpected query: ${sql}`);
        });

        const response = await request(app)
            .get('/api/workbooks')
            .query({ requester_id: 'owner-1', owner_id: 'owner-1', limit: 10, offset: 0 });

        expect(response.status).toBe(200);
        expect(Array.isArray(response.body)).toBe(true);
        expect(response.body[0].name).toBe('Book.xlsx');
        expect(querySpy).toHaveBeenCalled();
    });

    test('supports history alias GET /api/workbooks/:id/history', async () => {
        const querySpy = jest.spyOn(pool, 'query').mockImplementation(async (sql) => {
            if (sql.includes('SELECT firebase_uid, email, role FROM users')) {
                return { rows: [{ firebase_uid: 'owner-2', email: 'owner2@test.com', role: 'user' }] };
            }

            if (sql.includes('FROM workbooks w')) {
                return {
                    rows: [{ id: 7, name: 'Finance', owner_id: 'owner-2', is_collaborator: false }],
                };
            }

            if (sql.includes('FROM commits c') && sql.includes('LEFT JOIN cell_versions cv')) {
                return {
                    rows: [{ id: 3, message: 'Commit A', user_id: 'owner-2', changes_count: '5' }],
                };
            }

            throw new Error(`Unexpected query: ${sql}`);
        });

        const response = await request(app)
            .get('/api/workbooks/7/history')
            .query({ requester_id: 'owner-2', limit: 10, offset: 0 });

        expect(response.status).toBe(200);
        expect(Array.isArray(response.body.commits)).toBe(true);
        expect(response.body.commits[0].message).toBe('Commit A');
        expect(querySpy).toHaveBeenCalled();
    });

    test('supports workbook-scoped commit detail alias', async () => {
        const querySpy = jest.spyOn(pool, 'query').mockImplementation(async (sql) => {
            if (sql.includes('SELECT firebase_uid, email, role FROM users')) {
                return { rows: [{ firebase_uid: 'owner-3', email: 'owner3@test.com', role: 'user' }] };
            }

            if (sql.includes('FROM workbooks w')) {
                return {
                    rows: [{ id: 8, name: 'Ops', owner_id: 'owner-3', is_collaborator: false }],
                };
            }

            if (sql.includes('SELECT id FROM commits WHERE id = $1 AND workbook_id = $2')) {
                return { rows: [{ id: 10 }] };
            }

            if (sql.includes('SELECT * FROM commits WHERE id = $1')) {
                return { rows: [{ id: 10, workbook_id: 8, user_id: 'owner-3' }] };
            }

            if (sql.includes('FROM commit_changes cc')) {
                return { rows: [{ id: 1, address: 'A1', worksheet_name: 'Sheet1' }] };
            }

            throw new Error(`Unexpected query: ${sql}`);
        });

        const response = await request(app)
            .get('/api/workbooks/8/commits/10')
            .query({ requester_id: 'owner-3' });

        expect(response.status).toBe(200);
        expect(response.body.commit.id).toBe(10);
        expect(Array.isArray(response.body.changes)).toBe(true);
        expect(querySpy).toHaveBeenCalled();
    });

    test('supports GET /api/cells/:cellId/history endpoint', async () => {
        const querySpy = jest.spyOn(pool, 'query').mockImplementation(async (sql) => {
            if (sql.includes('SELECT firebase_uid, email, role FROM users')) {
                return { rows: [{ firebase_uid: 'owner-4', email: 'owner4@test.com', role: 'user' }] };
            }

            if (sql.includes('FROM cells c') && sql.includes('JOIN worksheets ws')) {
                return {
                    rows: [{ id: 12, worksheet_id: 4, workbook_id: 2, owner_id: 'owner-4', is_collaborator: false }],
                };
            }

            if (sql.includes('FROM cell_versions cv') && sql.includes('JOIN commits c')) {
                return {
                    rows: [{ id: 99, commit_id: 20, cell_id: 12, value: '42', user_id: 'owner-4' }],
                };
            }

            throw new Error(`Unexpected query: ${sql}`);
        });

        const response = await request(app)
            .get('/api/cells/12/history')
            .query({ requester_id: 'owner-4', limit: 10, offset: 0 });

        expect(response.status).toBe(200);
        expect(response.body.cell_id).toBe(12);
        expect(Array.isArray(response.body.history)).toBe(true);
        expect(response.body.history[0].value).toBe('42');
        expect(querySpy).toHaveBeenCalled();
    });
});
