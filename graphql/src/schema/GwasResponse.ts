import { GraphQLObjectType, GraphQLList, GraphQLString, GraphQLFloat, GraphQLNonNull, GraphQLInt } from 'graphql';
import {
    resolve_gwas_study,
    resolve_gwas_study_cres,
    resolve_gwas_study_topCellTypes,
    resolve_gwas_study_allSNPs,
    resolve_gwas_studies,
    resolve_gwas_study_numLdBlocksOverlap,
    resolve_gwas_study_numCresOverlap,
    resolve_gwas_snps,
    resolve_gwas_study_activeBiosamples,
} from '../resolvers/gwas';
import * as CommonTypes from './CommonSchema';
import { resolve_gwas_ldblock_leadsnp, resolve_gwas_ldblock_snps } from '../resolvers/snp';
const GraphQLJSON = require('graphql-type-json');

export const GwasCellType = new GraphQLObjectType({
    name: 'GwasCellType',
    description: 'Data about a specific cell type in a GWAS study',
    fields: () => ({
        biosample_summary: {
            type: new GraphQLNonNull(GraphQLString),
        },
        expID: {
            type: new GraphQLNonNull(GraphQLString),
        },
        fdr: {
            type: new GraphQLNonNull(GraphQLFloat),
        },
        pval: {
            type: new GraphQLNonNull(GraphQLFloat),
        },
        ct: {
            type: new GraphQLNonNull(CommonTypes.CellTypeInfo),
        },
    }),
});

export const GwasCRE = new GraphQLObjectType({
    name: 'GwasCRE',
    description: 'Contains a cRE for Gwas and associated data',
    fields: () => ({
        cRE: {
            type: new GraphQLNonNull(CommonTypes.cRE),
        },
        geneid: {
            type: new GraphQLNonNull(GraphQLString),
        },
        snps: {
            type: new GraphQLNonNull(new GraphQLList(new GraphQLNonNull(GraphQLString))),
        },
    }),
});

export const GwasStudyInfo = new GraphQLObjectType({
    name: 'GwasStudyInfo',
    description: 'GWAS study info',
    fields: () => ({
        value: {
            description: 'Study value',
            type: new GraphQLNonNull(GraphQLString),
        },
        author: {
            description: 'Study author',
            type: new GraphQLNonNull(GraphQLString),
        },
        pubmed: {
            description: 'Pubmed id',
            type: new GraphQLNonNull(GraphQLString),
        },
        trait: {
            description: 'Study trait',
            type: new GraphQLNonNull(GraphQLString),
        },
        totalLDblocks: {
            description: 'Total number of LD blocks',
            type: new GraphQLNonNull(GraphQLInt),
        },
        numLdBlocksOverlap: {
            description: 'Total number of LD blocks that overlap ccREs',
            type: new GraphQLNonNull(GraphQLInt),
        },
        numCresOverlap: {
            description: 'Total number of ccRE that overlap',
            type: new GraphQLNonNull(GraphQLInt),
        },
    }),
});

export const LDBlock = new GraphQLObjectType({
    name: 'LDBlock',
    description: 'A single LD Block from a study',
    fields: () => ({
        name: {
            type: new GraphQLNonNull(GraphQLString),
        },
        study: {
            type: new GraphQLNonNull(GwasStudy),
        },
        leadsnp: {
            type: new GraphQLNonNull(CommonTypes.SNP),
            resolve: resolve_gwas_ldblock_leadsnp,
        },
        snps: {
            type: new GraphQLNonNull(new GraphQLList(new GraphQLNonNull(LDBlockSNP))),
            resolve: resolve_gwas_ldblock_snps,
        },
    }),
});

export const LDBlockSNP = new GraphQLObjectType({
    name: 'LDBlockSNP',
    description: 'A SNP in an LD Block in a study',
    fields: () => ({
        snp: {
            type: new GraphQLNonNull(CommonTypes.SNP),
        },
        r2: {
            type: new GraphQLNonNull(GraphQLFloat),
        },
        ldblock: {
            type: new GraphQLNonNull(LDBlock),
        },
    }),
});

export const GwasStudy = new GraphQLObjectType({
    name: 'GwasStudy',
    description: 'GWAS study data',
    fields: () => ({
        name: {
            description: 'Study name',
            type: new GraphQLNonNull(GraphQLString),
        },
        author: {
            description: 'Study author',
            type: new GraphQLNonNull(GraphQLString),
        },
        pubmed: {
            description: 'Pubmed id',
            type: new GraphQLNonNull(GraphQLString),
        },
        trait: {
            description: 'Study trait',
            type: new GraphQLNonNull(GraphQLString),
        },
        totalLDblocks: {
            description: 'Total number of LD blocks',
            type: new GraphQLNonNull(GraphQLInt),
        },
        numLdBlocksOverlap: {
            description: 'Total number of LD blocks that overlap ccREs',
            type: new GraphQLNonNull(GraphQLInt),
            resolve: resolve_gwas_study_numLdBlocksOverlap,
        },
        numCresOverlap: {
            description: 'Total number of ccRE that overlap',
            type: new GraphQLNonNull(GraphQLInt),
            resolve: resolve_gwas_study_numCresOverlap,
        },
        allSNPs: {
            type: new GraphQLNonNull(new GraphQLList(new GraphQLNonNull(LDBlockSNP))),
            resolve: resolve_gwas_study_allSNPs,
        },
        topCellTypes: {
            type: new GraphQLList(new GraphQLNonNull(GwasCellType)),
            resolve: resolve_gwas_study_topCellTypes,
        },
        cres: {
            args: {
                cellType: {
                    description: 'The cell type to get cres for. If null, will get cres for all cell types',
                    type: GraphQLString,
                },
            },
            type: new GraphQLNonNull(new GraphQLList(new GraphQLNonNull(GwasCRE))),
            resolve: resolve_gwas_study_cres,
        },
        activeBiosamples: {
            type: new GraphQLList(new GraphQLNonNull(GwasCellType)),
            args: {
                snp: {
                    type: new GraphQLNonNull(GraphQLString),
                },
            },
            resolve: resolve_gwas_study_activeBiosamples,
        },
    }),
});

export const GwasResponse = new GraphQLObjectType({
    name: 'Gwas',
    description: 'GWAS data',
    fields: () => ({
        studies: {
            type: new GraphQLNonNull(new GraphQLList(new GraphQLNonNull(GwasStudy))),
            resolve: resolve_gwas_studies,
        },
        study: {
            args: {
                study: { type: new GraphQLNonNull(GraphQLString) },
            },
            type: new GraphQLNonNull(GwasStudy),
            resolve: resolve_gwas_study,
        },
        snps: {
            args: {
                search: { type: new GraphQLNonNull(GraphQLString) },
            },
            type: new GraphQLNonNull(new GraphQLList(new GraphQLNonNull(CommonTypes.SNP))),
            resolve: resolve_gwas_snps,
        },
    }),
});

export default GwasResponse;
