import { GraphQLFieldResolver } from 'graphql';
import { snptable } from '../db/db_snp';
import { SNP } from '../types';
import { gwasStudiesBySNP } from '../db/db_gwas';
import { Gwas, study } from './gwas';

export const resolve_snps: GraphQLFieldResolver<any, any> = (source, args, context, info) => {
    const assembly = args.assembly;
    const range = args.range;
    const id = args.id;
    return snptable(assembly, range, id);
};

export const resolve_snps_relatedstudies: GraphQLFieldResolver<SNP, {}> = async source => {
    const assembly = source.assembly;
    const id = source.id;
    const studies = await gwasStudiesBySNP(assembly, id);
    const g = new Gwas(assembly);
    await g.awaitStudies();
    return studies.map(async study_name => {
        const study_obj = await study(g, study_name);
        return { ...study_obj, study: study_name, gwas_obj: g };
    });
};
