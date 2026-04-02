INSERT INTO users (firebase_uid, email, name, role)
VALUES
  ('seed-owner-1', 'owner1@example.com', 'Seed Owner', 'user'),
  ('seed-collab-1', 'collab1@example.com', 'Seed Collaborator', 'user')
ON CONFLICT (firebase_uid) DO NOTHING;

INSERT INTO workbooks (name, owner_id)
VALUES ('Seed Workbook.xlsx', 'seed-owner-1')
ON CONFLICT DO NOTHING;

WITH wb AS (
  SELECT id FROM workbooks WHERE owner_id = 'seed-owner-1' ORDER BY id DESC LIMIT 1
), ws AS (
  INSERT INTO worksheets (workbook_id, name, sheet_order)
  SELECT wb.id, 'Sheet1', 0 FROM wb
  ON CONFLICT DO NOTHING
  RETURNING id, workbook_id
), ws_fallback AS (
  SELECT id, workbook_id FROM ws
  UNION ALL
  SELECT id, workbook_id FROM worksheets
  WHERE workbook_id = (SELECT id FROM wb) AND name = 'Sheet1'
  LIMIT 1
), cell_upsert AS (
  INSERT INTO cells (worksheet_id, row_idx, col_idx, address, value, formula, style)
  SELECT id, 0, 0, 'A1', 'Seed Value', NULL, '{}'::jsonb FROM ws_fallback
  ON CONFLICT (worksheet_id, row_idx, col_idx)
  DO UPDATE SET value = EXCLUDED.value
  RETURNING id
)
SELECT 1;
