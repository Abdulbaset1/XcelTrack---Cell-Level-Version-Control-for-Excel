process.env.NODE_ENV = 'test';

const request = require('supertest');
const { app, pool, server, io } = require('../index');

describe('API guards and business rules', () => {
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

    test('blocks admin stats endpoint for non-admin requester', async () => {
        const querySpy = jest.spyOn(pool, 'query').mockResolvedValueOnce({
            rows: [{ firebase_uid: 'user-1', email: 'user@test.com', role: 'user' }],
        });

        const response = await request(app)
            .get('/api/admin/stats')
            .query({ requester_id: 'user-1' });

        expect(response.status).toBe(403);
        expect(response.body.code).toBe('ADMIN_REQUIRED');
        expect(querySpy).toHaveBeenCalledTimes(1);
    });

    test('requires requester_id on protected endpoint', async () => {
        const response = await request(app)
            .get('/api/notifications');

        expect(response.status).toBe(401);
        expect(response.body.code).toBe('REQUESTER_REQUIRED');
    });

    test('prevents deleting the last worksheet', async () => {
        const querySpy = jest.spyOn(pool, 'query').mockImplementation(async (sql) => {
            if (sql.includes('SELECT firebase_uid, email, role FROM users')) {
                return { rows: [{ firebase_uid: 'owner-1', email: 'owner@test.com', role: 'user' }] };
            }

            if (sql.includes('FROM workbooks w')) {
                return {
                    rows: [{ id: 99, name: 'Budget', owner_id: 'owner-1', is_collaborator: false }],
                };
            }

            if (sql.includes('COUNT(*)::int as count FROM worksheets')) {
                return { rows: [{ count: 1 }] };
            }

            throw new Error(`Unexpected query in test: ${sql}`);
        });

        const response = await request(app)
            .delete('/api/workbooks/99/sheets/7')
            .send({ requester_id: 'owner-1' });

        expect(response.status).toBe(409);
        expect(response.body.code).toBe('LAST_WORKSHEET_PROTECTED');
        expect(querySpy).toHaveBeenCalled();
    });

    test('returns notifications feed for requester', async () => {
        const querySpy = jest.spyOn(pool, 'query').mockImplementation(async (sql) => {
            if (sql.includes('SELECT firebase_uid, email, role FROM users')) {
                return { rows: [{ firebase_uid: 'user-2', email: 'user2@test.com', role: 'user' }] };
            }

            if (sql.includes('SELECT * FROM notifications')) {
                return {
                    rows: [
                        {
                            id: 1,
                            user_id: 'user-2',
                            type: 'info',
                            title: 'Test notification',
                            message: 'Hello',
                            is_read: false,
                            created_at: new Date().toISOString(),
                        },
                    ],
                };
            }

            throw new Error(`Unexpected query in test: ${sql}`);
        });

        const response = await request(app)
            .get('/api/notifications')
            .query({ requester_id: 'user-2', limit: 10, unreadOnly: false });

        expect(response.status).toBe(200);
        expect(Array.isArray(response.body.notifications)).toBe(true);
        expect(response.body.notifications[0].title).toBe('Test notification');
        expect(querySpy).toHaveBeenCalled();
    });

    test('requires resolvedValue for manual conflict resolution', async () => {
        const querySpy = jest.spyOn(pool, 'query').mockImplementation(async (sql) => {
            if (sql.includes('SELECT firebase_uid, email, role FROM users')) {
                return { rows: [{ firebase_uid: 'owner-2', email: 'owner2@test.com', role: 'user' }] };
            }

            if (sql.includes('FROM workbooks w')) {
                return {
                    rows: [{ id: 123, name: 'Finance', owner_id: 'owner-2', is_collaborator: false }],
                };
            }

            throw new Error(`Unexpected pool query in test: ${sql}`);
        });

        const mockClient = {
            query: jest.fn(async (sql) => {
                if (sql === 'BEGIN') return { rows: [] };
                if (sql.includes('SELECT * FROM conflicts')) {
                    return {
                        rows: [
                            {
                                id: 77,
                                workbook_id: 123,
                                worksheet_id: 1,
                                row_idx: 0,
                                col_idx: 0,
                                user1_id: 'owner-2',
                                user1_value: 'A',
                                user2_id: 'user-x',
                                user2_value: 'B',
                                status: 'pending',
                            },
                        ],
                    };
                }
                if (sql === 'ROLLBACK') return { rows: [] };
                throw new Error(`Unexpected client query in test: ${sql}`);
            }),
            release: jest.fn(),
        };

        const connectSpy = jest.spyOn(pool, 'connect').mockResolvedValue(mockClient);

        const response = await request(app)
            .post('/api/workbooks/123/conflicts/77/resolve')
            .send({ requester_id: 'owner-2', policy: 'manual', resolution: 'manual' });

        expect(response.status).toBe(400);
        expect(response.body.code).toBe('RESOLVED_VALUE_REQUIRED');
        expect(querySpy).toHaveBeenCalled();
        expect(connectSpy).toHaveBeenCalledTimes(1);
        expect(mockClient.query).toHaveBeenCalledWith('ROLLBACK');
        expect(mockClient.release).toHaveBeenCalled();
    });

    test('blocks commit creation when requester does not match user_id', async () => {
        const querySpy = jest.spyOn(pool, 'query').mockImplementation(async (sql) => {
            if (sql.includes('SELECT firebase_uid, email, role FROM users')) {
                return { rows: [{ firebase_uid: 'requester-a', email: 'req@test.com', role: 'user' }] };
            }

            if (sql.includes('FROM workbooks w')) {
                return {
                    rows: [{ id: 45, name: 'Roadmap', owner_id: 'requester-a', is_collaborator: false }],
                };
            }

            throw new Error(`Unexpected query in commit mismatch test: ${sql}`);
        });

        const response = await request(app)
            .post('/api/commits')
            .send({ workbook_id: 45, user_id: 'different-user', requester_id: 'requester-a', message: 'save' });

        expect(response.status).toBe(403);
        expect(response.body.code).toBe('COMMIT_USER_MISMATCH');
        expect(querySpy).toHaveBeenCalled();
    });

    test('blocks workbook upload when requester does not match owner_id', async () => {
        const querySpy = jest.spyOn(pool, 'query').mockImplementation(async (sql) => {
            if (sql.includes('SELECT firebase_uid, email, role FROM users')) {
                return { rows: [{ firebase_uid: 'requester-u', email: 'req-u@test.com', role: 'user' }] };
            }

            throw new Error(`Unexpected query in upload mismatch test: ${sql}`);
        });

        const response = await request(app)
            .post('/api/workbooks/upload')
            .field('owner_id', 'owner-other')
            .field('requester_id', 'requester-u')
            .attach('file', Buffer.from('test-content'), 'sample.xlsx');

        expect(response.status).toBe(403);
        expect(response.body.code).toBe('OWNER_MISMATCH');
        expect(querySpy).toHaveBeenCalled();
    });

    test('blocks rollback when requester does not match user_id', async () => {
        const querySpy = jest.spyOn(pool, 'query').mockImplementation(async (sql) => {
            if (sql.includes('SELECT firebase_uid, email, role FROM users')) {
                return { rows: [{ firebase_uid: 'owner-rb', email: 'rb@test.com', role: 'user' }] };
            }

            if (sql.includes('FROM workbooks w')) {
                return {
                    rows: [{ id: 501, name: 'Rollback WB', owner_id: 'owner-rb', is_collaborator: false }],
                };
            }

            throw new Error(`Unexpected query in rollback mismatch test: ${sql}`);
        });

        const response = await request(app)
            .post('/api/workbooks/501/rollback')
            .send({ requester_id: 'owner-rb', commit_id: 10, user_id: 'another-user' });

        expect(response.status).toBe(403);
        expect(response.body.code).toBe('ROLLBACK_USER_MISMATCH');
        expect(querySpy).toHaveBeenCalled();
    });

    test('returns invalid commit ids for diff endpoint when ids are malformed', async () => {
        const querySpy = jest.spyOn(pool, 'query').mockImplementation(async (sql) => {
            if (sql.includes('SELECT firebase_uid, email, role FROM users')) {
                return { rows: [{ firebase_uid: 'owner-d1', email: 'd1@test.com', role: 'user' }] };
            }

            if (sql.includes('FROM workbooks w')) {
                return {
                    rows: [{ id: 77, name: 'Diff WB', owner_id: 'owner-d1', is_collaborator: false }],
                };
            }

            throw new Error(`Unexpected query in invalid diff id test: ${sql}`);
        });

        const response = await request(app)
            .get('/api/workbooks/77/diff')
            .query({ requester_id: 'owner-d1', head: 'abc' });

        expect(response.status).toBe(400);
        expect(response.body.code).toBe('INVALID_COMMIT_IDS');
        expect(querySpy).toHaveBeenCalled();
    });

    test('returns commit-workbook mismatch when diff commits do not belong to workbook', async () => {
        const querySpy = jest.spyOn(pool, 'query').mockImplementation(async (sql) => {
            if (sql.includes('SELECT firebase_uid, email, role FROM users')) {
                return { rows: [{ firebase_uid: 'owner-d2', email: 'd2@test.com', role: 'user' }] };
            }

            if (sql.includes('FROM workbooks w')) {
                return {
                    rows: [{ id: 88, name: 'Diff WB 2', owner_id: 'owner-d2', is_collaborator: false }],
                };
            }

            if (sql.includes('SELECT id FROM commits WHERE workbook_id = $1')) {
                return { rows: [{ id: 900 }] };
            }

            throw new Error(`Unexpected query in diff mismatch test: ${sql}`);
        });

        const response = await request(app)
            .get('/api/workbooks/88/diff')
            .query({ requester_id: 'owner-d2', head: '900', base: '901' });

        expect(response.status).toBe(400);
        expect(response.body.code).toBe('COMMIT_WORKBOOK_MISMATCH');
        expect(querySpy).toHaveBeenCalled();
    });

    test('returns diff data with worksheetName on successful compare', async () => {
        const querySpy = jest.spyOn(pool, 'query').mockImplementation(async (sql, params) => {
            if (sql.includes('SELECT firebase_uid, email, role FROM users')) {
                return { rows: [{ firebase_uid: 'owner-d3', email: 'd3@test.com', role: 'user' }] };
            }

            if (sql.includes('FROM workbooks w')) {
                return {
                    rows: [{ id: 910, name: 'Diff Success', owner_id: 'owner-d3', is_collaborator: false }],
                };
            }

            if (sql.includes('SELECT id FROM commits WHERE workbook_id = $1')) {
                return { rows: [{ id: 1001 }] };
            }

            if (sql.includes('FROM cell_versions cv') && Array.isArray(params) && params[0] === 1001) {
                return {
                    rows: [
                        {
                            address: 'A1',
                            worksheet_name: 'Sheet1',
                            worksheet_id: 1,
                            row_idx: 0,
                            col_idx: 0,
                            value: '42',
                            formula: null,
                        },
                    ],
                };
            }

            throw new Error(`Unexpected query in diff success test: ${sql}`);
        });

        const response = await request(app)
            .get('/api/workbooks/910/diff')
            .query({ requester_id: 'owner-d3', head: '1001' });

        expect(response.status).toBe(200);
        expect(response.body.workbook_id).toBe(910);
        expect(response.body.base_commit).toBe('initial');
        expect(response.body.head_commit).toBe(1001);
        expect(Array.isArray(response.body.diffs)).toBe(true);
        expect(response.body.diffs[0]).toEqual(
            expect.objectContaining({
                worksheetName: 'Sheet1',
                cellReference: 'A1',
                changeType: 'added',
            })
        );
        expect(querySpy).toHaveBeenCalled();
    });

    test('rolls back workbook successfully and creates rollback commit snapshot', async () => {
        const querySpy = jest.spyOn(pool, 'query').mockImplementation(async (sql) => {
            if (sql.includes('SELECT firebase_uid, email, role FROM users')) {
                return { rows: [{ firebase_uid: 'owner-rs', email: 'rs@test.com', role: 'user' }] };
            }

            if (sql.includes('FROM workbooks w')) {
                return {
                    rows: [{ id: 601, name: 'Rollback Success', owner_id: 'owner-rs', is_collaborator: false }],
                };
            }

            throw new Error(`Unexpected pool query in rollback success test: ${sql}`);
        });

        const mockClient = {
            query: jest.fn(async (sql) => {
                if (sql === 'BEGIN') return { rows: [] };

                if (sql.includes('SELECT * FROM commits WHERE id = $1 AND workbook_id = $2')) {
                    return { rows: [{ id: 333, workbook_id: 601, user_id: 'owner-rs' }] };
                }

                if (sql.includes('SELECT cv.*, c.id as cell_id, c.worksheet_id')) {
                    return {
                        rows: [
                            { cell_id: 10, worksheet_id: 1, value: 'A', formula: null, style: {} },
                            { cell_id: 11, worksheet_id: 1, value: 'B', formula: '=A1', style: {} },
                        ],
                    };
                }

                if (sql.includes('UPDATE cells')) {
                    return { rows: [] };
                }

                if (sql.includes('INSERT INTO commits (workbook_id, user_id, message, hash)')) {
                    return { rows: [{ id: 444, workbook_id: 601, user_id: 'owner-rs', message: 'rollback' }] };
                }

                if (sql.includes('INSERT INTO cell_versions (commit_id, cell_id, value, formula, style)')) {
                    return { rows: [] };
                }

                if (sql === 'COMMIT') return { rows: [] };
                if (sql === 'ROLLBACK') return { rows: [] };

                throw new Error(`Unexpected client query in rollback success test: ${sql}`);
            }),
            release: jest.fn(),
        };

        const connectSpy = jest.spyOn(pool, 'connect').mockResolvedValue(mockClient);

        const response = await request(app)
            .post('/api/workbooks/601/rollback')
            .send({ requester_id: 'owner-rs', commit_id: 333, user_id: 'owner-rs' });

        expect(response.status).toBe(200);
        expect(response.body.message).toBe('Rollback successful');
        expect(response.body.cells_restored).toBe(2);
        expect(response.body.new_commit.id).toBe(444);

        expect(connectSpy).toHaveBeenCalledTimes(1);
        expect(mockClient.query).toHaveBeenCalledWith('COMMIT');
        expect(mockClient.release).toHaveBeenCalled();

        const updateCalls = mockClient.query.mock.calls.filter(([sql]) => typeof sql === 'string' && sql.includes('UPDATE cells'));
        const snapshotCalls = mockClient.query.mock.calls.filter(([sql]) => typeof sql === 'string' && sql.includes('INSERT INTO cell_versions'));
        expect(updateCalls.length).toBe(2);
        expect(snapshotCalls.length).toBe(2);
        expect(querySpy).toHaveBeenCalled();
    });

    test('returns rollback error when commit does not belong to workbook', async () => {
        const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

        const querySpy = jest.spyOn(pool, 'query').mockImplementation(async (sql) => {
            if (sql.includes('SELECT firebase_uid, email, role FROM users')) {
                return { rows: [{ firebase_uid: 'owner-re', email: 're@test.com', role: 'user' }] };
            }

            if (sql.includes('FROM workbooks w')) {
                return {
                    rows: [{ id: 602, name: 'Rollback Error', owner_id: 'owner-re', is_collaborator: false }],
                };
            }

            throw new Error(`Unexpected pool query in rollback error test: ${sql}`);
        });

        const mockClient = {
            query: jest.fn(async (sql) => {
                if (sql === 'BEGIN') return { rows: [] };
                if (sql.includes('SELECT * FROM commits WHERE id = $1 AND workbook_id = $2')) {
                    return { rows: [] };
                }
                if (sql === 'ROLLBACK') return { rows: [] };
                throw new Error(`Unexpected client query in rollback error test: ${sql}`);
            }),
            release: jest.fn(),
        };

        const connectSpy = jest.spyOn(pool, 'connect').mockResolvedValue(mockClient);

        const response = await request(app)
            .post('/api/workbooks/602/rollback')
            .send({ requester_id: 'owner-re', commit_id: 9999, user_id: 'owner-re' });

        expect(response.status).toBe(500);
        expect(response.body.error).toContain('Commit not found or does not belong to this workbook');
        expect(connectSpy).toHaveBeenCalledTimes(1);
        expect(mockClient.query).toHaveBeenCalledWith('ROLLBACK');
        expect(mockClient.release).toHaveBeenCalled();
        expect(querySpy).toHaveBeenCalled();
        expect(consoleErrorSpy).toHaveBeenCalled();
    });

    test('removes collaborator and creates access-removed notification', async () => {
        const roomEmitMock = jest.fn();
        const toSpy = jest.spyOn(io, 'to').mockReturnValue({ emit: roomEmitMock });

        const querySpy = jest.spyOn(pool, 'query').mockImplementation(async (sql, params) => {
            if (sql.includes('SELECT firebase_uid, email, role FROM users')) {
                return { rows: [{ firebase_uid: 'owner-3', email: 'owner3@test.com', role: 'user' }] };
            }

            if (sql.includes('FROM workbooks w')) {
                return {
                    rows: [{ id: 200, name: 'Roadmap', owner_id: 'owner-3', is_collaborator: false }],
                };
            }

            if (sql.includes('DELETE FROM workbook_collaborators')) {
                return { rows: [{ user_id: 'collab-1' }] };
            }

            if (sql.includes('INSERT INTO notifications')) {
                return { rows: [{ id: 501, created_at: new Date().toISOString(), is_read: false }] };
            }

            throw new Error(`Unexpected query in collaborator remove test: ${sql}`);
        });

        const response = await request(app)
            .delete('/api/workbooks/200/collaborators/collab-1')
            .send({ requester_id: 'owner-3' });

        expect(response.status).toBe(200);
        expect(response.body.message).toBe('Collaborator removed successfully');
        expect(response.body.collaborator_id).toBe('collab-1');

        const notificationInsertCall = querySpy.mock.calls.find(([sql]) =>
            typeof sql === 'string' && sql.includes('INSERT INTO notifications')
        );

        expect(notificationInsertCall).toBeTruthy();
        expect(notificationInsertCall[1][0]).toBe('collab-1');
        expect(notificationInsertCall[1][2]).toBe('Access removed');
        expect(toSpy).toHaveBeenCalledWith('user-collab-1');
        expect(roomEmitMock).toHaveBeenCalledWith(
            'notification:new',
            expect.objectContaining({
                user_id: 'collab-1',
                title: 'Access removed',
            })
        );
    });

    test('resolves conflict with last-writer-wins and commits changes', async () => {
        const roomEmitMock = jest.fn();
        const toSpy = jest.spyOn(io, 'to').mockReturnValue({ emit: roomEmitMock });

        const querySpy = jest.spyOn(pool, 'query').mockImplementation(async (sql) => {
            if (sql.includes('SELECT firebase_uid, email, role FROM users')) {
                return { rows: [{ firebase_uid: 'owner-4', email: 'owner4@test.com', role: 'user' }] };
            }

            if (sql.includes('FROM workbooks w')) {
                return {
                    rows: [{ id: 321, name: 'Forecast', owner_id: 'owner-4', is_collaborator: false }],
                };
            }

            if (sql.includes('INSERT INTO audit_logs')) {
                return { rows: [{ id: 1 }] };
            }

            if (sql.includes('INSERT INTO notifications')) {
                return { rows: [{ id: 700, created_at: new Date().toISOString(), is_read: false }] };
            }

            throw new Error(`Unexpected pool query in conflict success test: ${sql}`);
        });

        const mockClient = {
            query: jest.fn(async (sql, params) => {
                if (sql === 'BEGIN') return { rows: [] };

                if (sql.includes('SELECT * FROM conflicts')) {
                    return {
                        rows: [
                            {
                                id: 88,
                                workbook_id: 321,
                                worksheet_id: 7,
                                row_idx: 2,
                                col_idx: 3,
                                user1_id: 'owner-4',
                                user1_value: 'Old',
                                user2_id: 'collab-2',
                                user2_value: 'Latest',
                                status: 'pending',
                            },
                        ],
                    };
                }

                if (sql.includes('INSERT INTO cells')) {
                    return { rows: [] };
                }

                if (sql.includes('UPDATE conflicts')) {
                    return { rows: [] };
                }

                if (sql.includes('UPDATE workbooks SET updated_at')) {
                    return { rows: [] };
                }

                if (sql === 'COMMIT') return { rows: [] };
                if (sql === 'ROLLBACK') return { rows: [] };

                throw new Error(`Unexpected client query in conflict success test: ${sql}`);
            }),
            release: jest.fn(),
        };

        const connectSpy = jest.spyOn(pool, 'connect').mockResolvedValue(mockClient);

        const response = await request(app)
            .post('/api/workbooks/321/conflicts/88/resolve')
            .send({ requester_id: 'owner-4', policy: 'last-writer-wins' });

        expect(response.status).toBe(200);
        expect(response.body.message).toBe('Conflict resolved successfully');
        expect(response.body.resolution).toBe('last-writer-wins');
        expect(response.body.value).toBe('Latest');

        expect(connectSpy).toHaveBeenCalledTimes(1);
        expect(mockClient.query).toHaveBeenCalledWith('COMMIT');
        expect(mockClient.release).toHaveBeenCalled();

        const notificationInsertCalls = querySpy.mock.calls.filter(([sql]) =>
            typeof sql === 'string' && sql.includes('INSERT INTO notifications')
        );
        expect(notificationInsertCalls.length).toBe(2);

        expect(toSpy).toHaveBeenCalledWith('user-owner-4');
        expect(toSpy).toHaveBeenCalledWith('user-collab-2');
        expect(roomEmitMock).toHaveBeenCalledWith(
            'notification:new',
            expect.objectContaining({
                title: 'Conflict resolved',
                user_id: expect.any(String),
            })
        );
    });
});
