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
    fields: () => ({
        chrom: { type: new GraphQLNonNull(GraphQLString) },
        start: { type: GraphQLInt },
        end: { type: GraphQLInt },
        strand: { type: GraphQLString } // TODO: enum
    })
});

export const InputChromRange = new GraphQLInputObjectType({
    name: 'InputChromRange',
    fields: () => ({
        chrom: { type: new GraphQLNonNull(GraphQLString) },
        start: { type: GraphQLInt },
        end: { type: GraphQLInt },
    })
});

export const RequiredInputChromRange = new GraphQLInputObjectType({
    name: 'RequiredInputChromRange',
    fields: () => ({
        chrom: { type: new GraphQLNonNull(GraphQLString) },
        start: { type: new GraphQLNonNull(GraphQLInt) },
        end: { type: new GraphQLNonNull(GraphQLInt) },
    })
});

export const InputExpMax = new GraphQLInputObjectType({
    name: 'InputExpMax',
    fields: () => ({
        rank_ctcf_end: { type: GraphQLFloat },
        rank_ctcf_start: { type: GraphQLFloat },
        rank_dnase_end: { type: GraphQLFloat },
        rank_dnase_start: { type: GraphQLFloat },
        rank_enhancer_end: { type: GraphQLFloat },
        rank_enhancer_start: { type: GraphQLFloat },
        rank_promoter_end: { type: GraphQLFloat },
        rank_promoter_start: { type: GraphQLFloat },
    })
});

export const DataParameters = new GraphQLInputObjectType({
    name: 'DataParameters',
    fields: () => ({
        accessions: { type: new GraphQLList(GraphQLString) }, // TODO: special type
        cellType: { type: GraphQLString },
        range: { type: InputChromRange },
        expmaxs: { type: InputExpMax },
        element_type: { type: ElementType },
    })
});

export const SearchParameters = new GraphQLInputObjectType({
    name: 'SearchParameters',
    fields: () => ({
        q: {
            type: new GraphQLNonNull(GraphQLString),
        },
        tss: {
            description: 'Get coords between first and last transcription start sites',
            type: GraphQLBoolean,
        },
        promoter: {
            type: GraphQLBoolean,
        },
        tssDist: {
            type: GraphQLInt
        }
    })
});

export const PaginationParameters = new GraphQLInputObjectType({
    name: 'PaginationParameters',
    description: 'offset + limit <= 10000; limit <= 1000; to access more data, refine your search',
    fields: () => ({
        offset: {
            type: GraphQLInt
        },
        limit: {
            type: GraphQLInt
        },
    })
});

export const cREInfo = new GraphQLObjectType({
    name: 'info',
    fields: {
        assembly: {
            description: 'TODO',
            type: new GraphQLNonNull(Assembly)
        },
        ctcfmax: {
            description: 'TODO',
            type: new GraphQLNonNull(GraphQLFloat),
        },
        accession: {
            description: 'TODO',
            type: new GraphQLNonNull(GraphQLString),
        },
        k27acmax: {
            description: 'TODO',
            type: new GraphQLNonNull(GraphQLFloat),
        },
        k4me3max: {
            description: 'TODO',
            type: new GraphQLNonNull(GraphQLFloat),
        },
        concordant: {
            description: 'TODO',
            type: new GraphQLNonNull(GraphQLBoolean),
        },
        isproximal: {
            description: 'TODO',
            type: new GraphQLNonNull(GraphQLBoolean),
        }
    },
});

export const genes = new GraphQLObjectType({
    name: 'genesallpc',
    fields: {
        pc: {
            description: 'TODO',
            type: new GraphQLNonNull(new GraphQLList(GraphQLString)),
        },
        all: {
            description: 'TODO',
            type: new GraphQLNonNull(new GraphQLList(GraphQLString)),
        },
    },
});

export const ctSpecific = new GraphQLObjectType({
    name: 'ctSpecific',
    fields: {
        ct: {
            description: 'TODO',
            type: new GraphQLNonNull(GraphQLString)
        },
        dnase_zscore: {
            description: 'TODO',
            type: GraphQLFloat
        },
        promoter_zscore: {
            description: 'TODO',
            type: GraphQLFloat
        },
        enhancer_zscore: {
            description: 'TODO',
            type: GraphQLFloat
        },
        ctcf_zscore: {
            description: 'TODO',
            type: GraphQLFloat
        },
    }
});

export const cREData = new GraphQLObjectType({
    name: 'creData',
    fields: () => ({
        range: { type: CommonTypes.ChromRange },
        maxz: { type: new GraphQLNonNull(GraphQLFloat) },
        ctcf_zscore: { type: GraphQLFloat },
        ctspecific: { type: ctSpecific },
        enhancer_zscore: { type: GraphQLFloat },
        promoter_zscore: { type: GraphQLFloat },
        genesallpc: { type: new GraphQLNonNull(genes) },
        dnase_zscore: { type: GraphQLFloat },
    })
});

export const cRE = new GraphQLObjectType({
    name: 'cRE',
    fields: () => ({
        info: {
            description: 'TODO',
            type: new GraphQLNonNull(cREInfo),
        },
        data: {
            description: 'TODO',
            type: new GraphQLNonNull(cREData),
        },
    })
});
