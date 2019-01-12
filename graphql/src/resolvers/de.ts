import { GraphQLFieldResolver } from 'graphql';
import * as Common from '../db/db_common';
import * as DbDe from '../db/db_de';
import { loadCache } from '../db/db_cache';
import * as CoordUtils from '../coord_utils';
import { ChromRange, Gene, Assembly } from '../types';
import { UserInputError } from 'apollo-server-core';

export type DifferentialExpression = {
    isde: boolean;
    fc: number | null;
    ct1: string;
    ct2: string;
    gene: Gene;
};

export const convertCtToDect = (ct: string) =>
    ct
        .replace('C57BL/6_', '')
        .replace('embryo_', '')
        .replace('_days', '')
        .replace('postnatal_', '');

export const resolve_de_search_window: GraphQLFieldResolver<{}, any, { assembly: Assembly; gene: string }> = async (
    source,
    args
): Promise<{ gene: Gene; window: ChromRange } | undefined> => {
    const assembly = args.assembly;
    const gene = args.gene;
    if (assembly === 'hg19') {
        throw new UserInputError('hg19 does not have differential gene expression data');
    }
    const genemap = await loadCache(assembly).ensemblToGene();
    const gene_obj = await Common.findGene(assembly, gene);
    if (!gene_obj) {
        return undefined;
    }
    const minwindow = CoordUtils.expanded(gene_obj.coords, 250 * 1000 * 2);
    const genes = (await DbDe.genesInRegion(assembly, minwindow.chrom, minwindow.start, minwindow.end)).map(
        gene => genemap[gene.ensemblid]
    );
    let range_min = minwindow.start;
    let range_max = minwindow.end;
    genes.forEach(d => {
        range_min = Math.min(range_min, d.coords.start);
        range_max = Math.max(range_max, d.coords.end);
    });
    return {
        gene: gene_obj,
        window: {
            assembly,
            chrom: minwindow.chrom,
            start: range_min,
            end: range_max,
        },
    };
};
