import { db } from './db';

const cache = require('../db/db_cache').cache;

const fixedmap = {
    'limb': 'limb',
    'embryonic facial prominence': 'embryonic structure',
    'CH12.LX': 'blood',
    'neural tube': 'neural tube',
    'intestine': 'intestine',
    'hematopoietic stem cell': 'blood',
    'G1E': 'embryonic stem cell',
    'MEP': 'blood',
    'G1E-ER4': 'embryonic stem cell',
    'CMP': 'blood'
};

const tissueSort = (a, b) => a['tissue'].localeCompare(b['tissue']);
const tpmSort = (skey) => (a, b) => b[skey] - a[skey];

class TissueColors {
    tissueToColor; randColorGen;

    constructor(assembly) {
        this.tissueToColor = cache(assembly).colors['tissues'];
    }

    static pad = (n) => ('00' + n).substr(-2);
    static rand = () => Math.floor(Math.random() * 256);
    static randColorGen = () => TissueColors.pad(TissueColors.rand().toString(16));
    static randColor = () =>
        `#${TissueColors.randColorGen()}${TissueColors.randColorGen()}${TissueColors.randColorGen()}`;

    getTissueColor(t) {
        if (!(t in this.tissueToColor)) {
            console.log('missing tissue color for', t);
            return TissueColors.randColor();
        }
        const c = this.tissueToColor[t];
        if (!c.startsWith('#')) {
            return '#' + c;
        }
        return c;
    }
}

export class GeneExpression {
    assembly; tissueColors; itemsByRID;

    constructor(assembly) {
        this.assembly = assembly;
        this.tissueColors = new TissueColors(assembly);
        this.itemsByRID = {};
    }

    groupByTissue(rowsin, skey) {
        const sorter = (a, b) => {
            // sort by tissue, then TPM/FPKM descending
            const first = tissueSort(a, b);
            if (first !== 0) return first;
            return tpmSort(skey)(a, b);
        };
        const rows = rowsin.slice().sort(sorter);

        const ret = {};
        for (const row of rows) {
            if (!(row['rID'] in this.itemsByRID)) {
                this.itemsByRID[row['rID']] = row;
            }
            const t = row['tissue'];
            if (!(t in ret)) {
                const c = this.tissueColors.getTissueColor(t);
                ret[t] = {
                    'name': t,
                    'displayName': t,
                    'color': c,
                    'items': []
                };
            }
            ret[t]['items'].push(row['rID']);
        }
        return ret;
    }

    groupByTissueMax(rowsin, skey) {
        let rows = rowsin.slice().sort(tissueSort);

        let ret = {};
        for (const row of rows) {
            if (!(row['rID'] in this.itemsByRID)) {
                this.itemsByRID[row['rID']] = row;
            }
            const t = row['tissue'];
            if (!(t in ret)) {
                const c = this.tissueColors.getTissueColor(t);
                ret[t] = {
                    'name': t,
                    'displayName': t,
                    'color': c,
                    'items': [row]
                };
            } else {
                if (ret[t]['items'][0][skey] < row[skey]) {
                    ret[t]['items'][0] = row;
                }
            }
        }

        rows = Object.keys(ret).map(k => ret[k]);

        const sorter = (a, b) => b['items'][0][skey] - a['items'][0][skey];
        rows.sort(sorter);

        ret = {};
        rows.forEach((row, idx) => {
            const t = row['name'];
            const k = idx.toLocaleString('en', {minimumIntegerDigits: 3}) + '_' + t;
            ret[k] = row;
            ret[k]['items'] = row['items'].map(x => x['rID']);
        });
        return ret;
    }

    sortByExpression(rowsin, skey) {
        const rows = rowsin.slice().sort(tpmSort(skey));

        const ret = {};
        rows.forEach((row, idx) => {
            if (!(row['rID'] in this.itemsByRID)) {
                this.itemsByRID[row['rID']] = row;
            }
            const t = row['tissue'];
            const c = this.tissueColors.getTissueColor(t);
            const k = idx.toLocaleString('en', {minimumIntegerDigits: 3}) + '_' + t;
            ret[k] = {
                'name': k,
                'displayName': t,
                'color': c,
                'items': [row['rID']]
            };
        });
        return ret;
    }

    process(rows) {
        return {
            'byTissueTPM': this.groupByTissue(rows, 'rawTPM'),
            'byTissueFPKM': this.groupByTissue(rows, 'rawFPKM'),
            'byTissueMaxTPM': this.groupByTissueMax(rows, 'rawTPM'),
            'byTissueMaxFPKM': this.groupByTissueMax(rows, 'rawFPKM'),
            'byExpressionTPM': this.sortByExpression(rows, 'rawTPM'),
            'byExpressionFPKM': this.sortByExpression(rows, 'rawFPKM')
        };
    }

    async doComputeHorBars(rows, gene) {
        const assembly = this.assembly;

        if (rows.length === 0) {
            return {};
        }

        const makeEntry = (row) => {
            let tissue = row['organ'].trim();

            const doLog = (d) => {
                return parseFloat(Math.log2(parseFloat(d) + 0.01).toFixed(2));
            };

            if (tissue === '{}') {
                tissue = row['cellType'] in fixedmap ? fixedmap[row['cellType']] : '';
            }

            // built-in JSON encoder missing Decimal type, so cast to float
            return {
                'tissue': tissue,
                'cellType': row['cellType'],
                'rawTPM': parseFloat(row['tpm']),
                'logTPM': doLog(row['tpm']),
                'rawFPKM': parseFloat(row['fpkm']),
                'logFPKM': doLog(row['fpkm']),
                'expID': row['dataset'],
                'rep': row['replicate'],
                'ageTitle': row['agetitle'],
                'rID': row['id']
            };
        };

        const ret = this.process(rows.map(makeEntry));
        return ret;
    }

    async computeHorBars(gene, compartments, biosample_types) {
        const assembly = this.assembly;
        const tableName = 'r_expression_' + assembly;
        const q = `
            SELECT r.tpm, r_rnas_${assembly}.organ, r_rnas_${assembly}.cellType,
            r.dataset, r.replicate, r.fpkm, r_rnas_${assembly}.ageTitle, r.id
            FROM ${tableName} as r
            INNER JOIN r_rnas_${assembly} ON r_rnas_${assembly}.encode_id = r.dataset
            WHERE gene_name = '${gene}'
            AND r_rnas_${assembly}.cellCompartment = ANY ($1)
            AND r_rnas_${assembly}.biosample_type = ANY ($2)
        `;
        const res = await db.any(q, [compartments, biosample_types]);
        return this.doComputeHorBars(res, gene);
    }

    async computeHorBarsMean(gene, compartments, biosample_types) {
        const assembly = this.assembly;
        const tableName = 'r_expression_' + assembly;
        const q = `
            SELECT avg(r.tpm) as tpm, r_rnas_${assembly}.organ, r_rnas_${assembly}.cellType,
            r.dataset, 'mean' as replicate, avg(r.fpkm) as fpkm, r_rnas_${assembly}.    ageTitle,
            array_to_string(array_agg(r.id), ',') as id
            FROM r_expression_${assembly} AS r
            INNER JOIN r_rnas_${assembly} ON r_rnas_${assembly}.encode_id = r.dataset
            WHERE gene_name = '${gene}'
            AND r_rnas_${assembly}.cellCompartment = ANY ($1)
            AND r_rnas_${assembly}.biosample_type = ANY ($2)
            GROUP BY r_rnas_${assembly}.organ, r_rnas_${assembly}.cellType, r.dataset, r_rnas_${assembly}.ageTitle
        `;
        const res = await db.any(q, [compartments, biosample_types]);
        return this.doComputeHorBars(res, gene);
    }
}
