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
    GraphQLEnumType
} from 'graphql';
import * as CommonTypes from './CommonSchema';


export const Assembly = new GraphQLEnumType({
    name: 'Assembly',
    values: {
        mm10: {
            value: 'mm10'
        },
        hg19: {
            value: 'hg19'
        }
    }
});

export const ElementType = new GraphQLEnumType({
    name: 'ElementType',
    values: {
        promoterLike: {
            value: 'promoter-like'
        },
        enhancerLike: {
            value: 'enhancer-like'
        },
        insulatorLike: {
            value: 'insulator-like'
        }
    }
});

export const ChromRange = new GraphQLObjectType({
    name: 'ChromRange',
    description: 'Represents a range on a chromomsome. May optionally specify a strand.',
    fields: () => ({
        chrom: {
            description: 'Chromosome',
            type: new GraphQLNonNull(GraphQLString)
        },
        start: {
            description: 'Start position or null if full chromosome',
            type: GraphQLInt
        },
        end: {
            description: 'End position or null if full chromosome',
            type: GraphQLInt
        },
        strand: {
            description: 'Strand of this range or null if not defined',
            type: GraphQLString
        }
    })
});

export const InputChromRange = new GraphQLInputObjectType({
    name: 'InputChromRange',
    description: 'Represents a range on a chromomsome.',
    fields: () => ({
        chrom: {
            description: 'Chromosome',
            type: new GraphQLNonNull(GraphQLString)
        },
        start: {
            description: 'Start position or null if full chromosome',
            type: GraphQLInt
        },
        end: {
            description: 'End position or null if full chromosome',
            type: GraphQLInt
        }
    })
});

export const RequiredInputChromRange = new GraphQLInputObjectType({
    name: 'RequiredInputChromRange',
    description: 'Represents a range on a chromomsome.',
    fields: () => ({
        chrom: {
            description: 'Chromosome',
            type: new GraphQLNonNull(GraphQLString)
        },
        start: {
            description: 'Start position',
            type: new GraphQLNonNull(GraphQLInt)
        },
        end: {
            description: 'End position',
            type: new GraphQLNonNull(GraphQLInt)
        }
    })
});

export const InputExpMax = new GraphQLInputObjectType({
    name: 'InputExpMax',
    description: 'Defines information related to experimental zscore ranges',
    fields: () => ({
        rank_ctcf_end: {
            description: 'End of ctcf zscore range',
            type: GraphQLFloat
        },
        rank_ctcf_start: {
            description: 'Start of ctcf zscore range',
            type: GraphQLFloat
        },
        rank_dnase_end: {
            description: 'End of dnase zscore range',
            type: GraphQLFloat
        },
        rank_dnase_start: {
            description: 'Start of dnase zscore range',
            type: GraphQLFloat
        },
        rank_enhancer_end: {
            description: 'End of enhancer zscore range',
            type: GraphQLFloat
        },
        rank_enhancer_start: {
            description: 'Start of enhancer zscore range',
            type: GraphQLFloat
        },
        rank_promoter_end: {
            description: 'End of promoter zscore range',
            type: GraphQLFloat
        },
        rank_promoter_start: {
            description: 'Start of promoter zscore range',
            type: GraphQLFloat
        },
    })
});

export const DataParameters = new GraphQLInputObjectType({
    name: 'DataParameters',
    description: 'Parameters to define what ccREs should be returned from a DataResponse',
    fields: () => ({
        cellType: {
            description: 'If defined, will return celltype-specific information for ccREs returned',
            type: GraphQLString
        },
        accessions: {
            description: 'A list of accessions to return',
            type: new GraphQLList(GraphQLString)
        }, // TODO: special type
        range: {
            description: 'Only return ccREs that are within a range',
            type: InputChromRange
        },
        expmaxs: {
            description: 'Only return ccREs with max zscores for all available experiments that fall within specific ranges',
            type: InputExpMax
        },
        element_type: {
            description: 'Only return ccREs of a specific ElementType - UNIMPLEMENTED',
            type: ElementType
        }, // TODO: implement
    })
});

export const SearchParameters = new GraphQLInputObjectType({
    name: 'SearchParameters',
    description: 'Parameters to define a search',
    fields: () => ({
        q: {
            description: 'Search query. Valid queries include (but may not be limited to): ranges, genes, snps, ccRE accessions, cell types',
            type: new GraphQLNonNull(GraphQLString),
        },
        tss: {
            description: 'Get coords between first and last transcription start sites, if response is a gene',
            type: GraphQLBoolean,
        },
        tssDist: {
            description: 'Extend coords this many bp upstream of the tss, if response is a gene',
            type: GraphQLInt
        }
    })
});

export const PaginationParameters = new GraphQLInputObjectType({
    name: 'PaginationParameters',
    description: 'ADVANCED - you probably do not need this. offset + limit <= 10000; limit <= 1000; to access more data, refine your search',
    fields: () => ({
        offset: {
            description: 'Default 0. Instead of starting at the first ccRE, return ccREs offsetted.',
            type: GraphQLInt
        },
        limit: {
            description: 'Default 1000. Change the limit to the number of ccREs returned.',
            type: GraphQLInt
        },
    })
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
            type: new GraphQLNonNull(GraphQLString)
        },
        dnase_zscore: {
            description: 'Dnase zscore in the celltype, or null if not available',
            type: GraphQLFloat
        },
        promoter_zscore: {
            description: 'Promoter zscore in the celltype, or null if not available',
            type: GraphQLFloat
        },
        enhancer_zscore: {
            description: 'Enhancer zscore in the celltype, or null if not available',
            type: GraphQLFloat
        },
        ctcf_zscore: {
            description: 'Ctcf zscore in the celltype, or null if not available',
            type: GraphQLFloat
        },
    }
});

export const cRE = new GraphQLObjectType({
    name: 'cRE',
    description: 'All data related to ccRE.',
    fields: () => ({
        assembly: {
            description: 'Assembly the ccRE is defined of',
            type: new GraphQLNonNull(Assembly)
        },
        accession: {
            description: 'Accession of this ccRE',
            type: new GraphQLNonNull(GraphQLString),
        },
        range: {
            description: 'The range of the ccRE',
            type: new GraphQLNonNull(CommonTypes.ChromRange)
        },
        maxz: {
            description: 'The max zscore from any experiment in any celltype',
            type: new GraphQLNonNull(GraphQLFloat)
        },
        dnasemax: {
            description: 'Max dnase zscore of all experiments',
            type: new GraphQLNonNull(GraphQLFloat)
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
            description: 'celltype-specific zscores, if celltype was specified',
            type: ctSpecific
        },

        nearbygenes: {
            description: 'Nearby genes',
            type: new GraphQLNonNull(genes)
        },
    })
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
    })
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
    })
});
