import { GraphQLFieldResolver } from 'graphql';
import { exons } from '../db/db_common';
import { Assembly } from '../types';
import { getAssemblyFromCre } from '../utils';
import { ccRECtspecificLoaders } from '../db/db_cache';

export const resolve_gene_exons: GraphQLFieldResolver<any, any> = async source => {
    const assembly: Assembly = source.assembly;
    const ensemblid_ver: string = source.ensemblid_ver;
    return exons(assembly, ensemblid_ver);
};

export const resolve_biosampleinfo_ccREActivity: GraphQLFieldResolver<{ value: string }, any, any> = (source, args) => {
    const ct = source.value;
    const ccre: string = args.ccre;
    const assembly = getAssemblyFromCre(ccre);
    if (!assembly) {
        throw new Error('Invalid accession: ' + ccre);
    }
    return ccRECtspecificLoaders[assembly as Assembly].load(`${ccre}::${ct}`);
};
