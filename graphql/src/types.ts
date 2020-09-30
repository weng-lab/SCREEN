import { GraphQLFieldResolver } from 'graphql';

import { Gwas } from './resolvers/gwas';
import { dbcre } from './db/db_cre_table';

export type Resolver<Args = { [argName: string]: any }, Source = {}, Context = {}> = GraphQLFieldResolver<Source, Context, Args>;

export type Assembly = 'grch38' | 'mm10';
export type ChromRange = { assembly: Assembly; chrom: string; start: number; end: number, strand?: string };
export type SNP = { assembly: Assembly; id: string; range: ChromRange };
export type LDBlock = {
    assembly: Assembly;
    name: string;
    study: {
        study_name: string;
        gwas_obj: Gwas;
        [study_key: string]: any;
    };
    taggedsnp: string;
};
export type LDBlockSNP = { r2: number; snp: SNP; ldblock: LDBlock };
export type assaytype = 'dnase' | 'h3k4me3' | 'h3k27ac' | 'ctcf';
export type ctspecificdata = {
    ct: string;
    dnase_zscore: number;
    h3k4me3_zscore: number;
    h3k27ac_zscore: number;
    ctcf_zscore: number;
    maxz: number;
};

export type NearbyRE = {
    distance: number;
    cCRE: dbcre;
};
export type Gene = {
    assembly: Assembly;
    approved_symbol: string;
    ensemblid_ver: string;
    coords: ChromRange;
};
