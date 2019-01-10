import { GraphQLFieldResolver } from 'graphql';
import { Assembly, Gene } from '../types';
import { UserInputError } from 'apollo-server-core';
import { getGene, transcriptsForGene } from '../db/db_common';
import { GeneExpArgs } from './geneexp';
import { DifferentialExpression, convertCtToDect } from './de';
import { natsorter, removeEnsemblVer } from '../utils';
import { deGenes } from '../db/db_de';
import { loadCache } from '../db/db_cache';

export const resolve_gene: GraphQLFieldResolver<any, any, { assembly: Assembly; gene: string }> = async (
    source,
    args,
    context,
    info
) => {
    const assembly = args.assembly;
    const gene = args.gene;

    try {
        return getGene(assembly, gene);
    } catch (e) {
        throw new UserInputError(`Unknown gene '${gene}'. (Did you mispell?)`);
    }
};

export const resolve_gene_expression: GraphQLFieldResolver<
    Gene,
    any,
    { biosample?: string; biosample_types?: string[]; compartments?: string[]; normalized?: boolean }
> = async (source, args) => {
    return {
        args: {
            assembly: source.assembly,
            gene: source.gene,
            biosample: args.biosample,
            biosample_types: args.biosample_types,
            compartments: args.compartments,
            normalized: args.normalized,
        } as GeneExpArgs,
    };
};

export const resolve_gene_differentialexpression: GraphQLFieldResolver<
    Gene,
    any,
    { ct1: string; ct2: string }
> = async (source, args) => {
    const assembly = source.assembly;
    const gene = source.gene;
    const ct1 = args.ct1;
    const ct2 = args.ct2;
    if (assembly === 'hg19') {
        throw new UserInputError('hg19 does not have differential expression data.');
    }
    const ctmap = await loadCache(assembly).de_ctidmap();
    const de = await deGenes(
        assembly,
        convertCtToDect(ct1),
        convertCtToDect(ct2),
        [removeEnsemblVer(source.ensemblid_ver)],
        ctmap
    );
    return {
        gene: source,
        ct1,
        ct2,
        isde: de[0].isde,
        fc: de[0].fc,
    } as DifferentialExpression;
};

const sortTranscripts = (a, b) => natsorter(a.transcript, b.transcript);

export const resolve_gene_transcripts: GraphQLFieldResolver<Gene, any, {}> = async source => {
    const transcripts = await transcriptsForGene(source);
    transcripts.sort(sortTranscripts);
    return transcripts;
};
