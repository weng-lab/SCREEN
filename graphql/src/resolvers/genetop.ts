import { GraphQLFieldResolver } from 'graphql';
import * as DbGeneTop from '../db/db_genetop';

class GeneTop {
    assembly;
    colors; itemsByRID;

    constructor(assembly) {
        this.assembly = assembly
        this.itemsByRID = {};
    }

    // From https://stackoverflow.com/a/8831937
    hash = (s) => {
        let hash = 0;
        if (s.length == 0) {
            return hash;
        }
        for (var i = 0; i < s.length; i++) {
            const char = s.charCodeAt(i);
            hash = ((hash << 5) - hash) + char;
            hash = hash & hash; // Convert to 32bit integer
        }
        return hash;
    }

    getColor = g => ('#' + this.hash(g).toString().slice(0,6)).padEnd(7, '0');

    keySort = (skey) => (a, b) => b[skey] - a[skey];
    sortByExpression(rowsin, skey) {
        return rowsin.slice().sort(this.keySort(skey)).map((row, idx) => {
            if (!(row['rID'] in this.itemsByRID)) {
                this.itemsByRID[row['rID']] = row;
            }
            const g = row['gene_name'];
            const c = this.getColor(g)
            return {
                'name': g + idx,
                'displayName': g,
                'color': c,
                'items': [row['rID']]
            };
        });
    }

    process = (rows) => {
        return {
            'byExpressionTPM': this.sortByExpression(rows, "rawTPM"),
            'byExpressionFPKM"': this.sortByExpression(rows, "rawFPKM")
        }
    }

    // Mostly copied form db_geneexp
    async doComputeHorBars(rows, biosample) {
        const assembly = this.assembly;

        if (rows.length === 0) {
            return {};
        }

        const makeEntry = (row) => {
            const doLog = (d) => {
                return parseFloat(Math.log2(parseFloat(d) + 0.01).toFixed(2));
            };

            return {
                'tissue': biosample,
                'cellType': row['celltype'],
                'rawTPM': parseFloat(row['tpm']),
                'logTPM': doLog(row['tpm']),
                'rawFPKM': parseFloat(row['fpkm']),
                'logFPKM': doLog(row['fpkm']),
                'expID': row['dataset'],
                'rep': row['replicate'],
                'ageTitle': row['agetitle'],
                'rID': row['id'],                
                "gene_name": row['gene_name']
            };
        };

        const ret = this.process(rows.map(makeEntry));
        return ret;
    }

    async topGenes(biosample) {
        const assembly = this.assembly;
        const res = await DbGeneTop.topGenes(assembly, biosample);
        return this.doComputeHorBars(res, biosample);
    }
}

async function genetop(assembly, biosample) {
    const gt = new GeneTop(assembly);
    const single = gt.topGenes(biosample);
    const mean = {};
    const itemsByRID = gt.itemsByRID;
    const r = {
        biosample: biosample,
        ensemblid_ver: '',
        coords: null,
        single: single,
        mean: mean,
        itemsByRID: itemsByRID
    }
    return r;
}

export const resolve_genetop: GraphQLFieldResolver<any, any> = (source, args, context, info) => {
    const assembly = args.assembly;
    const biosample = args.biosample;
    console.log(assembly, biosample);
    return genetop(assembly, biosample);
};
