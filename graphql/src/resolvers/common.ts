import { GraphQLFieldResolver } from 'graphql';
import { exons } from '../db/db_common';
import { Assembly } from '../types';

export const resolve_gene_exons: GraphQLFieldResolver<any, any> = async source => {
    const assembly: Assembly = source.assembly;
    const ensemblid_ver: string = source.ensemblid_ver;
    return exons(assembly, ensemblid_ver);
};
