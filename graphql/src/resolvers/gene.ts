import { GraphQLFieldResolver } from 'graphql';
import { Assembly, Gene, Resolver, ChromRange } from '../types';
import { UserInputError } from 'apollo-server-core';
import { transcriptsForGene, genesLoader, geneExons } from '../db/db_common';
import { DifferentialExpression, convertCtToDect } from './de';
import { natsorter, removeEnsemblVer } from '../utils';
import { deGenesLoader } from '../db/db_de';
import { GeneExpArgs } from './geneexp';
import { resolve_gene_rampage } from './rampage';

export type Transcript = {
    gene: Gene;
    transcript: string;
    range: ChromRange;
};

export const resolve_gene: Resolver<{ assembly: Assembly; gene: string }> = async (source, args) => {
    const assembly = args.assembly;
    const gene = args.gene;

    return genesLoader[assembly].load(gene);
};

export const resolve_gene_exons: GraphQLFieldResolver<any, any> = async source => {
    const assembly: Assembly = source.assembly;
    if (assembly !== 'mm10') {
        throw new Error('Can only resolve exons for mm10.');
    }
    const ensemblid_ver: string = source.ensemblid_ver;
    return geneExons(assembly, ensemblid_ver);
};

export const resolve_gene_expression: Resolver<{ biosample_types?: string[]; compartments?: string[] }, Gene> = async (
    source,
    args
): Promise<{ gene_info: Gene; args: GeneExpArgs }> => {
    return {
        gene_info: source,
        args: {
            assembly: source.assembly,
            gene: source,
            biosample_types: args.biosample_types,
            compartments: args.compartments,
        },
    };
};

export const resolve_gene_differentialexpression: GraphQLFieldResolver<
    Gene,
    any,
    { ct1: string; ct2: string }
> = async (source, args) => {
    const assembly = source.assembly;
    const ct1 = args.ct1;
    const ct2 = args.ct2;
    if (assembly !== 'mm10') {
        throw new UserInputError('Differential expression data only available for mm10.');
    }
    const de = await deGenesLoader[assembly].load(
        `${convertCtToDect(ct1)}:${convertCtToDect(ct2)}:${removeEnsemblVer(source.ensemblid_ver)}`
    );
    return {
        gene: source,
        ct1,
        ct2,
        isde: de.isde,
        fc: de.fc,
    } as DifferentialExpression;
};

const sortTranscripts = (a, b) => natsorter(a.transcript, b.transcript);

export const resolve_gene_transcripts: Resolver<Transcript, Gene> = async source => {
    if (source.assembly !== 'mm10') {
        throw new Error('Can only get transcripts for mm10.');
    }
    const transcripts = await transcriptsForGene(source);
    transcripts.sort(sortTranscripts);
    return transcripts;
};

export const geneResolvers = {
    Gene: {
        exons: resolve_gene_exons,
        expression: resolve_gene_expression,
        differentialExpression: resolve_gene_differentialexpression,
        transcripts: resolve_gene_transcripts,
        rampage: resolve_gene_rampage,
    },
};
