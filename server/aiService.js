class AIService {
    constructor() {
        this.provider = (process.env.AI_PROVIDER || 'heuristic').toLowerCase();
        this.openaiApiKey = process.env.OPENAI_API_KEY;
        this.openaiModel = process.env.OPENAI_MODEL || 'gpt-4o-mini';
    }

    _extractFunctions(formula = '') {
        const matches = String(formula).toUpperCase().match(/[A-Z]+\(/g) || [];
        return Array.from(new Set(matches.map((m) => m.replace('(', ''))));
    }

    _heuristicExplainFormula(formula) {
        const normalized = String(formula || '').trim();
        if (!normalized) {
            return 'No formula provided.';
        }

        const functions = this._extractFunctions(normalized);
        if (functions.length === 0) {
            return `This appears to be a direct expression: ${normalized}. It likely computes a value without a named Excel function.`;
        }

        const hints = {
            SUM: 'adds numbers in a range',
            AVERAGE: 'returns the arithmetic mean of values',
            IF: 'evaluates a condition and returns one of two results',
            VLOOKUP: 'searches vertically in the first column of a table and returns a value from another column',
            HLOOKUP: 'searches horizontally in the first row of a table and returns a value from another row',
            XLOOKUP: 'looks up a value in a range and returns a matching result',
            INDEX: 'returns a value by row/column position in a range',
            MATCH: 'returns the relative position of a lookup value',
            COUNT: 'counts numeric cells',
            COUNTA: 'counts non-empty cells',
            MIN: 'returns the smallest value',
            MAX: 'returns the largest value',
            CONCAT: 'joins text values',
            CONCATENATE: 'joins text values',
            LEFT: 'returns characters from the left side of text',
            RIGHT: 'returns characters from the right side of text',
            MID: 'returns characters from the middle of text',
            ROUND: 'rounds a number to a specified number of digits',
        };

        const lines = functions.map((fn) => `- ${fn}: ${hints[fn] || 'standard Excel function'}`);
        return `Formula ${normalized} uses the following function(s):\n${lines.join('\n')}`;
    }

    async _openAiText(prompt, systemMessage) {
        if (this.provider !== 'openai' || !this.openaiApiKey) {
            return null;
        }

        const response = await fetch('https://api.openai.com/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${this.openaiApiKey}`,
            },
            body: JSON.stringify({
                model: this.openaiModel,
                messages: [
                    { role: 'system', content: systemMessage },
                    { role: 'user', content: prompt },
                ],
                temperature: 0.2,
            }),
        });

        if (!response.ok) {
            const text = await response.text();
            throw new Error(`OpenAI request failed: ${response.status} ${text}`);
        }

        const data = await response.json();
        return {
            text: data?.choices?.[0]?.message?.content || '',
            usage: data?.usage || { prompt_tokens: 0, completion_tokens: 0, total_tokens: 0 },
            provider: 'openai',
            model: this.openaiModel,
        };
    }

    async explainFormula({ formula, context = {} }) {
        if (!formula) {
            throw new Error('formula is required');
        }

        try {
            const prompt = `Explain this Excel formula in plain language for a business user.\nFormula: ${formula}\nContext: ${JSON.stringify(context)}`;
            const system = 'You explain spreadsheet formulas clearly and concisely.';
            const aiResponse = await this._openAiText(prompt, system);

            if (aiResponse?.text) {
                return {
                    explanation: aiResponse.text,
                    provider: aiResponse.provider,
                    model: aiResponse.model,
                    usage: aiResponse.usage,
                    fallback: false,
                };
            }
        } catch (error) {
            // fall through to heuristic response
        }

        return {
            explanation: this._heuristicExplainFormula(formula),
            provider: 'heuristic',
            model: 'local-rule-engine',
            usage: { prompt_tokens: 0, completion_tokens: 0, total_tokens: 0 },
            fallback: true,
        };
    }

    async respondToPrompt({ prompt, context = {} }) {
        const normalizedPrompt = String(prompt || '').trim();
        if (!normalizedPrompt) {
            throw new Error('prompt is required');
        }

        const selectedCells = Array.isArray(context.selectedCells) ? context.selectedCells : [];

        try {
            const aiPrompt = [
                `User question: ${normalizedPrompt}`,
                `Workbook context: ${JSON.stringify({
                    workbook_id: context.workbook_id,
                    worksheet_id: context.worksheet_id,
                    selection: context.selection,
                    selectedCellsPreview: selectedCells.slice(0, 50),
                })}`,
                'Answer concisely and with spreadsheet-specific guidance.',
            ].join('\n\n');

            const system = 'You are a spreadsheet assistant for collaborative workbook editing.';
            const aiResponse = await this._openAiText(aiPrompt, system);

            if (aiResponse?.text) {
                return {
                    answer: aiResponse.text,
                    provider: aiResponse.provider,
                    model: aiResponse.model,
                    usage: aiResponse.usage,
                    fallback: false,
                };
            }
        } catch (error) {
            // fall back to local heuristic
        }

        const selectedCount = selectedCells.length;
        const nonEmptyCells = selectedCells.filter((cell) => {
            const value = cell?.value;
            const formula = cell?.formula;
            return (value !== null && value !== undefined && String(value).trim() !== '') ||
                (formula !== null && formula !== undefined && String(formula).trim() !== '');
        });

        const sample = nonEmptyCells.slice(0, 8)
            .map((cell) => `${cell.address}: ${cell.formula ? `formula ${cell.formula}` : `value ${cell.value}`}`)
            .join('; ');

        const heuristicAnswer = selectedCount > 0
            ? `You asked: "${normalizedPrompt}". I reviewed ${selectedCount} selected cell(s), with ${nonEmptyCells.length} non-empty cell(s). Sample: ${sample || 'No non-empty sample values available.'} Suggested next step: refine your prompt with the exact expected output (summary, fix, explanation, or validation) for this selected range.`
            : `You asked: "${normalizedPrompt}". No explicit range data was provided. Select a cell/range and ask again for a context-aware answer.`;

        return {
            answer: heuristicAnswer,
            provider: 'heuristic',
            model: 'local-rule-engine',
            usage: { prompt_tokens: 0, completion_tokens: 0, total_tokens: 0 },
            fallback: true,
        };
    }

    detectErrors(cells = []) {
        const errorTokens = ['#REF!', '#DIV/0!', '#VALUE!', '#N/A', '#NAME?', '#NUM!', '#NULL!'];
        const findings = [];

        for (const cell of cells) {
            const worksheetName = cell.worksheet_name || cell.worksheetName || 'Sheet';
            const address = cell.address || 'Unknown';
            const value = cell.value == null ? '' : String(cell.value);
            const formula = cell.formula == null ? '' : String(cell.formula);

            for (const token of errorTokens) {
                if (value.toUpperCase().includes(token) || formula.toUpperCase().includes(token)) {
                    findings.push({
                        worksheet: worksheetName,
                        cell: address,
                        errorType: token,
                        currentValue: value,
                        formula,
                        suggestion: this._suggestForError(token),
                    });
                    break;
                }
            }

            if (formula) {
                const normalizedFormula = formula.startsWith('=') ? formula.substring(1) : formula;
                if (normalizedFormula.toUpperCase().includes(address.toUpperCase())) {
                    findings.push({
                        worksheet: worksheetName,
                        cell: address,
                        errorType: 'CIRCULAR_REFERENCE_SUSPECTED',
                        currentValue: value,
                        formula,
                        suggestion: 'Review whether the formula references its own cell directly or indirectly.',
                    });
                }
            }
        }

        return {
            totalScanned: cells.length,
            totalIssues: findings.length,
            findings,
        };
    }

    _suggestForError(token) {
        const map = {
            '#REF!': 'Check for deleted/moved cell references and repair the formula ranges.',
            '#DIV/0!': 'Guard denominator with IF or IFERROR to avoid division by zero.',
            '#VALUE!': 'Verify data types and ensure functions receive expected numeric/text inputs.',
            '#N/A': 'Confirm lookup value exists and ranges are correct.',
            '#NAME?': 'Check function names and named ranges for typos.',
            '#NUM!': 'Validate numeric bounds and function constraints.',
            '#NULL!': 'Review range operators and intersections in the formula.',
        };

        return map[token] || 'Inspect formula references and input values.';
    }

    analyzeData(cells = []) {
        const numericPoints = [];

        for (const cell of cells) {
            const rawValue = cell.value;
            const parsed = typeof rawValue === 'number' ? rawValue : Number(rawValue);
            if (Number.isFinite(parsed)) {
                numericPoints.push({
                    worksheet: cell.worksheet_name || 'Sheet',
                    cell: cell.address || 'Unknown',
                    value: parsed,
                });
            }
        }

        if (numericPoints.length === 0) {
            return {
                summary: 'No numeric values found for analysis.',
                stats: null,
                outliers: [],
            };
        }

        const values = numericPoints.map((item) => item.value).sort((a, b) => a - b);
        const count = values.length;
        const min = values[0];
        const max = values[values.length - 1];
        const mean = values.reduce((sum, value) => sum + value, 0) / count;
        const median = count % 2 === 0
            ? (values[count / 2 - 1] + values[count / 2]) / 2
            : values[Math.floor(count / 2)];

        const variance = values.reduce((sum, value) => sum + ((value - mean) ** 2), 0) / count;
        const stdDev = Math.sqrt(variance);

        const q1 = values[Math.floor((count - 1) * 0.25)];
        const q3 = values[Math.floor((count - 1) * 0.75)];
        const iqr = q3 - q1;
        const lowerFence = q1 - 1.5 * iqr;
        const upperFence = q3 + 1.5 * iqr;

        const outliers = numericPoints.filter((point) => point.value < lowerFence || point.value > upperFence);

        return {
            summary: `Analyzed ${count} numeric cells. Mean=${mean.toFixed(2)}, median=${median.toFixed(2)}, min=${min}, max=${max}.`,
            stats: {
                count,
                min,
                max,
                mean,
                median,
                stdDev,
                q1,
                q3,
                iqr,
            },
            outliers,
        };
    }
}

module.exports = AIService;
