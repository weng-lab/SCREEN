import { GraphQLFieldResolver } from 'graphql';
import { Assembly, Gene } from '../types';
import { ChromRange } from '../types';
import { checkCoords } from './search';
import { cre_table } from './cretable';
import { loadCache } from '../db/db_cache';
import { genesInRegion } from '../db/db_de';
import { snptable } from '../db/db_snp';

export const resolve_range: GraphQLFieldResolver<{}, any, { assembly: Assembly; range: ChromRange }> = async (
    source,
    args
) => {
    checkCoords(args.assembly, args.range, true);
    return {
        assembly: args.assembly,
        chrom: args.range.chrom,
        start: args.range.start,
        end: args.range.end,
        strand: args.range.strand,
    };
};

export const resolve_range_ccres: GraphQLFieldResolver<ChromRange, any, {}> = async source => {
    const assembly = source.assembly;
    const data = { range: { chrom: source.chrom, start: source.start, end: source.end } };
    const results = await cre_table(data, assembly, { offset: 0, limit: 1000 });
    return results.ccres;
};

export const resolve_range_genes: GraphQLFieldResolver<ChromRange, any, {}> = async (source): Promise<Gene[]> => {
    const assembly = source.assembly;
    const ensemblToGene = await loadCache(assembly).ensemblToGene();
    const genes = await genesInRegion(assembly, source.chrom, source.start, source.end);
    return genes.map(gene => {
        const egene = ensemblToGene[gene.ensemblid];
        return {
            assembly,
            gene: egene.approved_symbol,
            ...egene,
        };
    });
};

export const resolve_range_snps: GraphQLFieldResolver<ChromRange, any, {}> = async source => {
    const assembly = source.assembly;
    const range = source;
    return snptable(assembly, range, undefined);
};
