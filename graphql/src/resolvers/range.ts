import { GraphQLFieldResolver } from 'graphql';
import { Assembly, Resolver } from '../types';
import { ChromRange } from '../types';
import { loadCache } from '../db/db_cache';
import { genesInRegion } from '../db/db_de';
import { snptable } from '../db/db_snp';
import { checkCoords } from '../utils';
import { getCreTable } from '../db/db_cre_table';
import { chrom_lengths } from '../constants';

export const resolve_range: Resolver<{ assembly: Assembly; range: ChromRange }> = async (source, args) => {
    checkCoords(args.assembly, args.range);
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
    const ctmap = await loadCache(assembly).ctmap();
    const results = await getCreTable(assembly, ctmap, data, {});
    return results.ccres;
};

export const resolve_range_genes: GraphQLFieldResolver<ChromRange, any, {}> = async source => {
    const assembly = source.assembly;
    const ensemblToGene = await loadCache(assembly).ensemblToGene();
    const genes = await genesInRegion(assembly, source.chrom, source.start, source.end);
    return genes.map(gene => ensemblToGene[gene.ensemblid]);
};

export const resolve_range_snps: GraphQLFieldResolver<ChromRange, any, {}> = async source => {
    const assembly = source.assembly;
    const range = source;
    return snptable(assembly, range, undefined);
};

export const resolve_range_expandFromCenter: Resolver<{ distance: number }, ChromRange> = (
    source,
    args
): ChromRange => {
    const distance = args.distance;
    const center = Math.round((source.end - source.start) / 2 + source.start);
    const newStart = Math.max(center - distance, 0);
    const newEnd = Math.min(center + distance, chrom_lengths[source.assembly][source.chrom]);
    return {
        assembly: source.assembly,
        chrom: source.chrom,
        start: newStart,
        end: newEnd,
        strand: source.strand,
    };
};

export const resolve_range_expandFromEdges: Resolver<{ distance: number }, ChromRange> = (source, args) => {
    const distance = args.distance;
    const newStart = Math.max(source.start - distance, 0);
    const newEnd = Math.min(source.end + distance, chrom_lengths[source.assembly][source.chrom]);
    return {
        assembly: source.assembly,
        chrom: source.chrom,
        start: newStart,
        end: newEnd,
        strand: source.strand,
    };
};

export const rangeResolvers = {
    ChromRange: {
        expandFromCenter: resolve_range_expandFromCenter,
        expandFromEdges: resolve_range_expandFromEdges,
        ccres: resolve_range_ccres,
        genes: resolve_range_genes,
        snps: resolve_range_snps,
    },
};
