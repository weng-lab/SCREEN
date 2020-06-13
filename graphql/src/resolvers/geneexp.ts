import { GraphQLFieldResolver } from 'graphql';
import { UserInputError } from 'apollo-server-express';

import * as Common from '../db/db_common';
import * as DbGene from '../db/db_geneexp';
import { loadCache } from '../db/db_cache';
import { Assembly, Gene } from '../types';

export type GeneExpArgs = {
    assembly: Assembly;
    gene: Gene;
    biosample_types?: string[] | null;
    compartments?: string[] | null;
};

export const resolve_geneexp_items: GraphQLFieldResolver<{ args: GeneExpArgs }, any, {}> = async source => {
    const sourceargs = source.args;
    const assembly = sourceargs.assembly;
    const gene = sourceargs.gene;
    let biosample_types = sourceargs.biosample_types;
    let compartments = sourceargs.compartments;

    const geBiosampleTypes = await loadCache(assembly).geBiosampleTypes();

    const available_biosamples = geBiosampleTypes;
    if (!biosample_types) {
        biosample_types = available_biosamples;
    } else if (biosample_types.some(b => available_biosamples.indexOf(b) === -1)) {
        throw new UserInputError(
            'invalid biosample types: ' + biosample_types.filter(b => available_biosamples.indexOf(b) === -1).join(',')
        );
    }

    const available_compartments = await loadCache(assembly).geCellCompartments();
    if (!compartments) {
        compartments = available_compartments;
    } else if (compartments.some(b => available_compartments.indexOf(b) === -1)) {
        throw new UserInputError(
            'invalid biosample types: ' + compartments.filter(b => available_compartments.indexOf(b) === -1).join(',')
        );
    }

    return DbGene.computeHorBarsAll(assembly, gene.approved_symbol, compartments, biosample_types);
};

export const resolve_geneexp: GraphQLFieldResolver<any, any> = async (
    source,
    args,
    context
): Promise<{ gene_info: Gene; args: GeneExpArgs }> => {
    const assembly = args.assembly.toLowerCase();
    const gene = args.gene;
    const biosample_types = args.biosample_types;
    const compartments = args.compartments;
    const rows = await Common.geneInfo(assembly, gene);
    if (rows.length === 0) {
        throw new Error(`${gene} is not a valid gene.`);
    }
    const gi = rows[0];
    const gene_info = {
        assembly,
        approved_symbol: gene,
        ensemblid_ver: gi.ensemblid_ver,
        coords: {
            assembly,
            chrom: gi.chrom,
            start: gi.start,
            end: gi.stop,
            strand: gi.strand,
        },
    };
    return {
        args: {
            assembly,
            gene: gene_info,
            biosample_types,
            compartments,
        },
        gene_info,
    };
};

export const geneExpressionResolvers = {
    GeneExpression: {
        items: resolve_geneexp_items,
    },
};
