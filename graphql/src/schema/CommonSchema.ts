import {
    GraphQLBoolean,
    GraphQLList,
    GraphQLString,
    GraphQLInt,
    GraphQLFloat,
    GraphQLObjectType,
    GraphQLSchema,
    GraphQLID,
    GraphQLNonNull,
    GraphQLInputObjectType,
    GraphQLEnumType,
} from 'graphql';
import * as CommonTypes from './CommonSchema';
import { CreDetailsResponse } from './CreDetailsResponse';
import { resolve_data_nearbygenes, resolve_data_range, resolve_data_ctspecific } from '../resolvers/cretable';
import { resolve_details } from '../resolvers/credetails';
import { resolve_snps_relatedstudies, resolve_snps_ldblocks } from '../resolvers/snp';
import { GwasStudy, LDBlock, LDBlockSNP } from './GwasResponse';

export const Assembly = new GraphQLEnumType({
    name: 'Assembly',
    values: {
        mm10: {
            value: 'mm10',
        },
        hg19: {
            value: 'hg19',
        },
    },
});

export const ChromRange = new GraphQLObjectType({
    name: 'ChromRange',
    description: 'Represents a range on a chromomsome. May optionally specify a strand.',
    fields: () => ({
        chrom: {
            description: 'Chromosome',
            type: new GraphQLNonNull(GraphQLString),
        },
        start: {
            description: 'Start position or null if full chromosome',
            type: GraphQLInt,
        },
        end: {
            description: 'End position or null if full chromosome',
            type: GraphQLInt,
        },
        strand: {
            description: 'Strand of this range or null if not defined',
            type: GraphQLString,
        },
    }),
});

export const InputChromRange = new GraphQLInputObjectType({
    name: 'InputChromRange',
    description: 'Represents a range on a chromomsome.',
    fields: () => ({
        chrom: {
            description: 'Chromosome',
            type: new GraphQLNonNull(GraphQLString),
        },
        start: {
            description: 'Start position or null if full chromosome',
            type: GraphQLInt,
        },
        end: {
            description: 'End position or null if full chromosome',
            type: GraphQLInt,
        },
    }),
});

export const RequiredInputChromRange = new GraphQLInputObjectType({
    name: 'RequiredInputChromRange',
    description: 'Represents a range on a chromomsome.',
    fields: () => ({
        chrom: {
            description: 'Chromosome',
            type: new GraphQLNonNull(GraphQLString),
        },
        start: {
            description: 'Start position',
            type: new GraphQLNonNull(GraphQLInt),
        },
        end: {
            description: 'End position',
            type: new GraphQLNonNull(GraphQLInt),
        },
    }),
});

export const InputExpMax = new GraphQLInputObjectType({
    name: 'InputExpMax',
    description: 'Defines information related to experimental zscore ranges',
    fields: () => ({
        rank_ctcf_end: {
            description: 'End of ctcf zscore range',
            type: GraphQLFloat,
        },
        rank_ctcf_start: {
            description: 'Start of ctcf zscore range',
            type: GraphQLFloat,
        },
        rank_dnase_end: {
            description: 'End of dnase zscore range',
            type: GraphQLFloat,
        },
        rank_dnase_start: {
            description: 'Start of dnase zscore range',
            type: GraphQLFloat,
        },
        rank_enhancer_end: {
            description: 'End of enhancer zscore range',
            type: GraphQLFloat,
        },
        rank_enhancer_start: {
            description: 'Start of enhancer zscore range',
            type: GraphQLFloat,
        },
        rank_promoter_end: {
            description: 'End of promoter zscore range',
            type: GraphQLFloat,
        },
        rank_promoter_start: {
            description: 'Start of promoter zscore range',
            type: GraphQLFloat,
        },
    }),
});

export const InputCtExps = new GraphQLInputObjectType({
    name: 'InputCtExps',
    description:
        'Defines acceptable zscore ranges for a single celltype. ' +
        'If a particular celltype does not have a particular experiment, then the range will not be applicable',
    fields: () => ({
        cellType: {
            description: 'The celltype that the ranges apply to',
            type: new GraphQLNonNull(GraphQLString),
        },
        rank_ctcf_end: {
            description: 'End of ctcf zscore range',
            type: GraphQLFloat,
        },
        rank_ctcf_start: {
            description: 'Start of ctcf zscore range',
            type: GraphQLFloat,
        },
        rank_dnase_end: {
            description: 'End of dnase zscore range',
            type: GraphQLFloat,
        },
        rank_dnase_start: {
            description: 'Start of dnase zscore range',
            type: GraphQLFloat,
        },
        rank_enhancer_end: {
            description: 'End of enhancer zscore range',
            type: GraphQLFloat,
        },
        rank_enhancer_start: {
            description: 'Start of enhancer zscore range',
            type: GraphQLFloat,
        },
        rank_promoter_end: {
            description: 'End of promoter zscore range',
            type: GraphQLFloat,
        },
        rank_promoter_start: {
            description: 'Start of promoter zscore range',
            type: GraphQLFloat,
        },
    }),
});

export const DataParameters = new GraphQLInputObjectType({
    name: 'DataParameters',
    description: 'Parameters to define what ccREs should be returned from a DataResponse',
    fields: () => ({
        accessions: {
            description: 'A list of accessions to return',
            type: new GraphQLList(new GraphQLNonNull(GraphQLString)),
        }, // TODO: special type
        range: {
            description: 'Only return ccREs that are within a range',
            type: InputChromRange,
        },
        expmaxs: {
            description:
                'Only return ccREs with max zscores for all available experiments that fall within specific ranges',
            type: InputExpMax,
        },
        ctexps: {
            description:
                'Only return ccREs with zscores for all available experiments that fall within specific ranges for the specified cell type',
            type: InputCtExps,
        },
    }),
});

export const SearchParameters = new GraphQLInputObjectType({
    name: 'SearchParameters',
    description: 'Parameters to define a search',
    fields: () => ({
        q: {
            description:
                'Search query. Valid queries include (but may not be limited to): ranges, genes, snps, ccRE accessions, cell types',
            type: new GraphQLNonNull(GraphQLString),
        },
    }),
});

export const OrderBy = new GraphQLEnumType({
    name: 'OrderBy',
    values: {
        maxz: {
            description: '(DEFAULT)',
            value: 'maxz',
        },
        maxz_ct: {
            description: 'UNIMPLEMENTED. Just returns maxz',
            value: 'maxz_ct',
        },
        dnasemax: {
            value: 'dnasemax',
        },
        k27acmax: {
            value: 'k27acmax',
        },
        k4me3max: {
            value: 'k4me3max',
        },
        ctcfmax: {
            value: 'ctcfmax',
        },
        dnase_zscore: {
            description: '(Only available if celltype-specific)',
            value: 'dnase_zscore',
        },
        promoter_zscore: {
            description: '(Only available if celltype-specific)',
            value: 'promoter_zscore',
        },
        enhancer_zscore: {
            description: '(Only available if celltype-specific)',
            value: 'enhancer_zscore',
        },
        ctcf_zscore: {
            description: '(Only available if celltype-specific)',
            value: 'ctcf_zscore',
        },
    },
});

export const PaginationParameters = new GraphQLInputObjectType({
    name: 'PaginationParameters',
    description:
        'ADVANCED - you probably do not need this. offset + limit <= 10000; limit <= 1000; to access more data, refine your search',
    fields: () => ({
        offset: {
            description: 'Default 0. Instead of starting at the first ccRE, return ccREs offsetted.',
            type: GraphQLInt,
        },
        limit: {
            description: 'Default 1000. Change the limit to the number of ccREs returned.',
            type: GraphQLInt,
        },
        orderBy: {
            description:
                'The field to order by. If an ct-specific orderby is passed, but is not applicable to the ct (i.e. no data), then maxz will be used instead.',
            type: OrderBy,
        },
    }),
});

export const genes = new GraphQLObjectType({
    name: 'genes',
    description: 'Nearby genes',
    fields: {
        pc: {
            description: 'Nearby protein-coding genes',
            type: new GraphQLNonNull(new GraphQLList(new GraphQLNonNull(GraphQLString))),
        },
        all: {
            description: 'All nearby genes, including protein-coding and non-protein-coding',
            type: new GraphQLNonNull(new GraphQLList(new GraphQLNonNull(GraphQLString))),
        },
    },
});

export const ctSpecific = new GraphQLObjectType({
    name: 'ctSpecific',
    description: 'If a celltype was specific, provide celltype-specific data',
    fields: {
        ct: {
            description: 'Current celltype',
            type: new GraphQLNonNull(GraphQLString),
        },
        dnase_zscore: {
            description: 'Dnase zscore in the celltype, or null if not available',
            type: GraphQLFloat,
        },
        h3k4me3_zscore: {
            description: 'h3k4me3 zscore in the celltype, or null if not available',
            type: GraphQLFloat,
        },
        h3k27ac_zscore: {
            description: 'h3k27ac zscore in the celltype, or null if not available',
            type: GraphQLFloat,
        },
        ctcf_zscore: {
            description: 'Ctcf zscore in the celltype, or null if not available',
            type: GraphQLFloat,
        },
        maxz: {
            description: 'The max z score of all ctspecific data',
            type: new GraphQLNonNull(GraphQLFloat),
        },
    },
});

export const cRE = new GraphQLObjectType({
    name: 'cRE',
    description: 'All data related to a ccRE.',
    fields: () => ({
        assembly: {
            description: 'Assembly the ccRE is defined of',
            type: new GraphQLNonNull(Assembly),
        },
        accession: {
            description: 'Accession of this ccRE',
            type: new GraphQLNonNull(GraphQLString),
        },
        range: {
            description: 'The range of the ccRE',
            type: new GraphQLNonNull(CommonTypes.ChromRange),
            resolve: resolve_data_range,
        },
        maxz: {
            description: 'The max zscore from any experiment in any celltype',
            type: new GraphQLNonNull(GraphQLFloat),
        },
        dnasemax: {
            description: 'Max dnase zscore of all experiments',
            type: new GraphQLNonNull(GraphQLFloat),
        },
        ctcfmax: {
            description: 'Max ctcf zscore of all experiments',
            type: new GraphQLNonNull(GraphQLFloat),
        },
        k27acmax: {
            description: 'Max k27ac zscore of all experiments',
            type: new GraphQLNonNull(GraphQLFloat),
        },
        k4me3max: {
            description: 'Max k4me3 zscore of all experiments',
            type: new GraphQLNonNull(GraphQLFloat),
        },
        concordant: {
            description: 'Does this ccRE have an ortholog in other assemblies',
            type: new GraphQLNonNull(GraphQLBoolean),
        },
        isproximal: {
            description: 'Is ccRE +/- 2kb of TSS',
            type: new GraphQLNonNull(GraphQLBoolean),
        },
        ctspecific: {
            description: 'celltype-specific zscores',
            type: ctSpecific,
            args: {
                ct: {
                    type: new GraphQLNonNull(GraphQLString),
                },
            },
            resolve: resolve_data_ctspecific,
        },
        nearbygenes: {
            description: 'Nearby genes',
            type: new GraphQLNonNull(genes),
            resolve: resolve_data_nearbygenes,
        },
        details: {
            description: 'Get details about this ccRE',
            type: new GraphQLNonNull(CreDetailsResponse),
            resolve: resolve_details,
        },
    }),
});

// TODO: document these
export const CellTypeAssay = new GraphQLObjectType({
    name: 'CellTypeAssay',
    description: 'Info on a single assay from a cell type',
    fields: () => ({
        assay: { type: new GraphQLNonNull(GraphQLString) },
        expid: { type: new GraphQLNonNull(GraphQLString) },
        fileid: { type: new GraphQLNonNull(GraphQLString) },
        biosample_summary: { type: new GraphQLNonNull(GraphQLString) },
        biosample_type: { type: new GraphQLNonNull(GraphQLString) },
    }),
});

// TODO: document these
export const CellTypeInfo = new GraphQLObjectType({
    name: 'CellTypeInfo',
    description: 'Info on a cell type used in SCREEN and in ccREs',
    fields: () => ({
        name: { type: GraphQLString },
        value: { type: new GraphQLNonNull(GraphQLString) },
        tissue: { type: new GraphQLNonNull(GraphQLString) },
        displayName: { type: new GraphQLNonNull(GraphQLString) },
        isde: { type: new GraphQLNonNull(GraphQLBoolean) },
        synonyms: { type: new GraphQLList(new GraphQLNonNull(GraphQLString)) },
        assays: { type: new GraphQLList(new GraphQLNonNull(CellTypeAssay)) },
    }),
});

export const SNP = new GraphQLObjectType({
    name: 'SNP',
    description: 'A SNP',
    fields: () => ({
        assembly: {
            description: 'The SNP assembly',
            type: new GraphQLNonNull(Assembly),
        },
        id: {
            description: 'The SNP id',
            type: new GraphQLNonNull(GraphQLString),
        },
        range: {
            description: 'The range of this SNP',
            type: new GraphQLNonNull(CommonTypes.ChromRange),
        },
        ldblocks: {
            description:
                'Data related to LD blocks that this SNP belongs to. If no GWAS data is available for the SNP assembly or no related GWAS data is available, this is an empty array.',
            type: new GraphQLNonNull(new GraphQLList(new GraphQLNonNull(LDBlockSNP))),
            resolve: resolve_snps_ldblocks,
        },
        related_studies: {
            description:
                'GWAS studies containing this SNP. If no GWAS data is available for the SNP assembly or no related GWAS data is available, this is an empty array.',
            type: new GraphQLNonNull(new GraphQLList(new GraphQLNonNull(GwasStudy))),
            resolve: resolve_snps_relatedstudies,
        },
    }),
});
