import { GraphQLFieldResolver } from 'graphql';
import { Assembly } from '../types';
import { getAssemblyFromCre } from '../utils';
import { ccRECtspecificLoaders } from '../db/db_cache';
import { transcriptExons } from '../db/db_common';

export const resolve_biosampleinfo_ccREActivity: GraphQLFieldResolver<{ value: string }, any, any> = (source, args) => {
    const ct = source.value;
    const ccre: string = args.ccre;
    const assembly = getAssemblyFromCre(ccre);
    if (!assembly) {
        throw new Error('Invalid accession: ' + ccre);
    }
    return ccRECtspecificLoaders[assembly as Assembly].load(`${ccre}::${ct}`);
};

export const resolve_transcript_exons: GraphQLFieldResolver<any, any> = async source => {
    const assembly: Assembly = source.gene.assembly;
    const transcript_ver: string = source.transcript;
    return transcriptExons(assembly, transcript_ver);
};
