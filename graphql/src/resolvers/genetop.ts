import { GraphQLFieldResolver } from 'graphql';
import * as DbGeneTop from '../db/db_genetop';

const doLog = d => parseFloat(Math.log2(parseFloat(d) + 0.01).toFixed(2));

const makeEntry = row => ({
    tissue: row['organ'],
    cellType: row['celltype'],
    gene_name: row['gene_name'],
    expID: row['expid'],
    ageTitle: row['agetitle'],
    rID: row['id'],
    replicate: row['replicate'],
    rawTPM: row['tpm'],
    logTPM: doLog(row['tpm']),
    rawFPKM: row['fpkm'],
    logFPKM: doLog(row['fpkm']),
});

const topGenes = async (assembly, biosample, normalized) => {
    const res = await DbGeneTop.topGenes(assembly, biosample, normalized);
    return res.map(makeEntry);
};

export const resolve_genetop: GraphQLFieldResolver<any, any> = (source, args, context, info) => {
    const assembly = args.assembly;
    const biosample = args.biosample;
    const normalized = args.normalized !== null ? args.normalized : true;
    return topGenes(assembly, biosample, normalized);
};
