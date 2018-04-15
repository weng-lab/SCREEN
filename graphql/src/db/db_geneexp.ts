import { db } from './db';
import TissueColors from '../tissuecolors';
import { natsorter } from '../utils';

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

export class GeneExpression {
    assembly; itemsByRID;

    constructor(assembly) {
        this.assembly = assembly;
        this.itemsByRID = {};
    }

    // TODO: use HelperGrouper
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
                const c = TissueColors.getTissueColor(t);
                ret[t] = {
                    'name': t,
                    'displayName': t,
                    'color': c,
                    'items': []
                };
            }
            ret[t]['items'].push(row['rID']);
        }
        const sortedkeys = Object.keys(ret).sort(natsorter);
        return sortedkeys.map(tissue => ret[tissue]);
    }

    groupByTissueMax(rowsin, skey) {
        let rows = rowsin.slice().sort(tissueSort);

        const ret = {};
        for (const row of rows) {
            if (!(row['rID'] in this.itemsByRID)) {
                this.itemsByRID[row['rID']] = row;
            }
            const t = row['tissue'];
            if (!(t in ret)) {
                const c = TissueColors.getTissueColor(t);
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
        return rows.map(row => ({ ...row, items: row.items.map(x => x['rID']) }));
    }

    sortByExpression(rowsin, skey) {
        return rowsin.slice().sort(tpmSort(skey)).map((row, idx) => {
            if (!(row['rID'] in this.itemsByRID)) {
                this.itemsByRID[row['rID']] = row;
            }
            const t = row['tissue'];
            const c = TissueColors.getTissueColor(t);
            return {
                'name': t + idx,
                'displayName': t,
                'color': c,
                'items': [row['rID']]
            };
        });
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
                'cellType': row['celltype'],
                'rawTPM': parseFloat(row['tpm']),
                'logTPM': doLog(row['tpm']),
                'rawFPKM': parseFloat(row['fpkm']),
                'logFPKM': doLog(row['fpkm']),
                'expID': row['expid'],
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
        const tableNameData = assembly + '_rnaseq_expression_norm';
	const tableNameMetadata = assembly + '_rnaseq_expression_metadata';
        const q = `
            SELECT r.tpm, ${tableNameMetadata}.organ, ${tableNameMetadata}.cellType,
            r.expid, r.replicate, r.fpkm, ${tableNameMetadata}.ageTitle, r.id
            FROM ${tableNameData} as r
            INNER JOIN ${tableNameMetadata} ON ${tableNameMetadata}.expid = r.expid
            WHERE gene_name = '${gene}'
            AND ${tableNameMetadata}.cellCompartment = ANY ($1)
            AND ${tableNameMetadata}.biosample_type = ANY ($2)
        `;
        const res = await db.any(q, [compartments, biosample_types]);
        return this.doComputeHorBars(res, gene);
    }

    async computeHorBarsMean(gene, compartments, biosample_types) {
        const assembly = this.assembly;
        const tableNameData = assembly + '_rnaseq_expression_norm';
	const tableNameMetadata = assembly + '_rnaseq_expression_metadata';
        const q = `
            SELECT avg(r.tpm) as tpm, ${tableNameMetadata}.organ,
	    ${tableNameMetadata}.cellType,
            r.expid, 'mean' as replicate, avg(r.fpkm) as fpkm, ${tableNameMetadata}.ageTitle,
            array_to_string(array_agg(r.id), ',') as id
            FROM ${assembly}_rnaseq_expression AS r
            INNER JOIN ${tableNameMetadata} ON ${tableNameMetadata}.expid = r.expid
            WHERE gene_name = '${gene}'
            AND ${tableNameMetadata}.cellCompartment = ANY ($1)
            AND ${tableNameMetadata}.biosample_type = ANY ($2)
            GROUP BY ${tableNameMetadata}.organ, ${tableNameMetadata}.cellType, r.expid,
	    ${tableNameMetadata}.ageTitle
        `;
        const res = await db.any(q, [compartments, biosample_types]);
        return this.doComputeHorBars(res, gene);
    }
}
