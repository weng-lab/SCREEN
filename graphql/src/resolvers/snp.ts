import { GraphQLFieldResolver } from 'graphql';
import { snptable, nearbygenes } from '../db/db_snp';
import { SNP, Assembly } from '../types';
import { gwasLDBlockSNPBySNP, SNPsInLDBlock } from '../db/db_gwas';
import { Gwas } from './gwas';
import { getCreTable } from '../db/db_cre_table';
import { loadCache } from '../db/db_cache';

export const resolve_snps: GraphQLFieldResolver<any, any> = async (source, args, context, info) => {
    const assembly = args.assembly.toLowerCase();
    const range = args.range;
    const id = args.id;
    if (!assembly && !id) {
        throw new Error('Must pass either an assembly or a range.');
    }
    if (id && range) {
        throw new Error('Cannot pass both a range and an id.');
    }
    if (!assembly) {
        for (const test_assembly of ['GRCh38', 'mm10'] as Assembly[]) {
            const snps = await snptable(test_assembly, range, id);
            if (snps.length > 0) {
                return snps;
            }
        }
        return [];
    }
    return snptable(assembly, range, id);
};

export const resolve_snps_ldblocks: GraphQLFieldResolver<any, {}> = async source => {
    const assembly = source.assembly;
    if (assembly !== 'grch38') {
        return [];
    }
    const id = source.id;
    const g = new Gwas(assembly);
    await g.awaitStudies();
    return gwasLDBlockSNPBySNP(assembly, id, g);
};

export const resolve_gwas_ldblock_leadsnp: GraphQLFieldResolver<any, {}> = async source => {
    const assembly = source.assembly;
    const taggedsnp = source.taggedsnp;
    const leadsnp = await snptable(assembly, undefined, taggedsnp);
    return leadsnp[0];
};

export const resolve_gwas_ldblock_snps: GraphQLFieldResolver<any, {}> = async source => {
    const assembly = source.assembly;
    const ldblock_name = source.name;
    const gwas_obj: Gwas = source.study.gwas_obj;
    return SNPsInLDBlock(assembly, ldblock_name, gwas_obj);
};

export const resolve_snps_relatedstudies: GraphQLFieldResolver<SNP, {}> = async (source, args, context, info) => {
    const ldblocks = await resolve_snps_ldblocks(source, args, context, info);
    return ldblocks.map(block => block.ldblock.study);
};

export const resolve_snps_overlapping_ccRE: GraphQLFieldResolver<SNP, {}> = async source => {
    const assembly: Assembly = source.assembly;
    const snp: string = source.id;
    const ctmap = await loadCache(assembly).ctmap();
    const ctable = await getCreTable(assembly, ctmap, { range: source.range }, {});
    return ctable.ccres[0];
};

export const resolve_snps_nearbygenes: GraphQLFieldResolver<SNP, {}> = async source => {
    const assembly: Assembly = source.assembly;
    const snp: string = source.id;
    return nearbygenes(assembly, snp);
};
