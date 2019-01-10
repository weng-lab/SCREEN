import { GraphQLFieldResolver } from 'graphql';
import { exonsfortranscript, transcriptsForGene, Gene } from '../db/db_common';
import { Assembly } from '../types';
import { getAssemblyFromCre } from '../utils';
import { UserInputError } from 'apollo-server-express';
import { ccRECtspecificLoaders } from '../db/db_cache';

export const resolve_gene_exons: GraphQLFieldResolver<Gene, any> = async source => {
    // Here we first pick a random transcript, and get exons
    // TODO: pick "best" transcript for default exons
    // This is also two queries instead of one. This is done to reuse the 'exonsfortranscript'
    // This shouldn't have much performance overhead since these are simple lookups
    const transcripts = await transcriptsForGene(source);
    if (transcripts.length === 0) {
        return [];
    }
    return exonsfortranscript(source.assembly, transcripts[0].transcript);
};

export const resolve_transcript_exons: GraphQLFieldResolver<any, any> = async source => {
    const assembly: Assembly = source.gene.assembly;
    const transcript_ver: string = source.transcript;
    return exonsfortranscript(assembly, transcript_ver);
};

export const resolve_celltypeinfo_ccREActivity: GraphQLFieldResolver<{ value: string }, any, { ccre: string }> = (
    source,
    args
) => {
    const ct = source.value;
    const ccre = args.ccre;
    const assembly = getAssemblyFromCre(ccre);
    if (!assembly) {
        throw new UserInputError('Invalid accession: ' + ccre);
    }
    return ccRECtspecificLoaders[assembly as Assembly].load(`${ccre}::${ct}`);
};
