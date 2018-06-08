import { GraphQLFieldResolver } from 'graphql';
import { snptable } from '../db/db_snp';
import { SNP, Assembly } from '../types';
import { gwasLDBlockSNPBySNP, SNPsInLDBlock } from '../db/db_gwas';
import { Gwas } from './gwas';
import { UserError } from 'graphql-errors';

export const resolve_snps: GraphQLFieldResolver<any, any> = async (source, args, context, info) => {
    const assembly = args.assembly;
    const range = args.range;
    const id = args.id;
    if (!assembly && !id) {
        throw new UserError('Must pass either an assembly or a range.');
    }
    if (id && range) {
        throw new UserError('Cannot pass both a range and an id.');
    }
    if (!assembly) {
        for (const test_assembly of ['hg19', 'mm10'] as Assembly[]) {
            const snps = await snptable(test_assembly, range, id);
            if (snps.length > 0) {
                return snps;
            }
        }
        return [];
    }
    return snptable(assembly, range, id);
};

export const resolve_snps_ldblocks: GraphQLFieldResolver<any, {}> = async source => {
    const assembly = source.assembly;
    if (assembly !== 'hg19') {
        throw new UserError(`${assembly} does not have GWAS data.`);
    }
    const id = source.id;
    const ldblocks = await gwasLDBlockSNPBySNP(assembly, id);
    const g = new Gwas(assembly);
    await g.awaitStudies();
    return Promise.all(
        ldblocks.map(async ldblock => {
            const studyarg = ldblock.authorpubmedtrait;
            if (!g.checkStudy(studyarg)) {
                throw new UserError('invalid gwas study');
            }
            return {
                snp: {
                    assembly,
                    id: ldblock.snp,
                    range: {
                        chrom: ldblock.chrom,
                        start: ldblock.start,
                        end: ldblock.stop,
                    },
                },
                r2: ldblock.r2,
                ldblock: {
                    assembly,
                    name: ldblock.ldblock,
                    study: {
                        study_name: studyarg,
                        gwas_obj: g,
                    },
                    taggedsnp: ldblock.taggedsnp,
                },
            };
        })
    );
};

export const resolve_gwas_ldblock_leadsnp: GraphQLFieldResolver<any, {}> = async source => {
    const assembly = source.assembly;
    const taggedsnp = source.taggedsnp;
    const leadsnp = await snptable(assembly, undefined, taggedsnp);
    return leadsnp[0];
};

export const resolve_gwas_ldblock_snps: GraphQLFieldResolver<any, {}> = async source => {
    const assembly = source.assembly;
    const ldblock_name = source.name;
    return SNPsInLDBlock(assembly, ldblock_name);
};

export const resolve_snps_relatedstudies: GraphQLFieldResolver<SNP, {}> = async (source, args, context, info) => {
    const ldblocks = await resolve_snps_ldblocks(source, args, context, info);
    return ldblocks.map(block => block.ldblock.study);
};
