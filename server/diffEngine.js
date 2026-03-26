/**
 * diffEngine.js
 * Logic for comparing workbook commits and generating semantic descriptions.
 */

class DiffEngine {
    constructor(pool) {
        this.pool = pool;
    }

    /**
     * Compare two commits and return cell-level differences.
     * If baseCommitId is null, it's compared against an empty state (all added).
     */
    async compareCommits(workbookId, baseCommitId, headCommitId) {
        // Fetch head commit versions
        const headVersions = await this.getCommitCellVersions(headCommitId);

        if (!baseCommitId) {
            // Initial commit case: everything is "added"
            return headVersions.map(v => ({
                cellReference: v.address,
                changeType: 'added',
                newValue: v.value,
                newFormula: v.formula,
                description: this.generateSemanticDescription(null, v)
            }));
        }

        // Fetch base commit versions
        const baseVersions = await this.getCommitCellVersions(baseCommitId);

        const diffs = [];
        const baseMap = new Map(baseVersions.map(v => [`${v.worksheet_id}:${v.row_idx}:${v.col_idx}`, v]));
        const headMap = new Map(headVersions.map(v => [`${v.worksheet_id}:${v.row_idx}:${v.col_idx}`, v]));

        // Check for modifications and additions
        for (const [key, headV] of headMap) {
            const baseV = baseMap.get(key);
            if (!baseV) {
                diffs.push({
                    cellReference: headV.address,
                    changeType: 'added',
                    newValue: headV.value,
                    newFormula: headV.formula,
                    description: this.generateSemanticDescription(null, headV)
                });
            } else if (baseV.value !== headV.value || baseV.formula !== headV.formula) {
                diffs.push({
                    cellReference: headV.address,
                    changeType: 'modified',
                    oldValue: baseV.value,
                    newValue: headV.value,
                    oldFormula: baseV.formula,
                    newFormula: headV.formula,
                    description: this.generateSemanticDescription(baseV, headV)
                });
            }
        }

        // Check for deletions
        for (const [key, baseV] of baseMap) {
            if (!headMap.has(key)) {
                diffs.push({
                    cellReference: baseV.address,
                    changeType: 'deleted',
                    oldValue: baseV.value,
                    oldFormula: baseV.formula,
                    description: this.generateSemanticDescription(baseV, null)
                });
            }
        }

        return diffs;
    }

    async getCommitCellVersions(commitId) {
        const query = `
            SELECT cv.*, c.address, c.row_idx, c.col_idx, c.worksheet_id 
            FROM cell_versions cv
            JOIN cells c ON cv.cell_id = c.id
            WHERE cv.commit_id = $1
        `;
        const result = await this.pool.query(query, [commitId]);
        return result.rows;
    }

    generateSemanticDescription(oldCell, newCell) {
        if (!oldCell && newCell) {
            return `Added value "${newCell.value || ''}" to cell ${newCell.address}`;
        }
        if (oldCell && !newCell) {
            return `Deleted value from cell ${oldCell.address}`;
        }

        // Formula change
        if (oldCell.formula !== newCell.formula) {
            if (newCell.formula) {
                return `Updated formula in ${newCell.address} to ${newCell.formula}`;
            } else {
                return `Removed formula from ${newCell.address}, value is now "${newCell.value}"`;
            }
        }

        // Value change
        if (oldCell.value !== newCell.value) {
            return `Changed ${newCell.address} from "${oldCell.value || ''}" to "${newCell.value || ''}"`;
        }

        return `Updated cell ${newCell.address}`;
    }
}

module.exports = DiffEngine;
