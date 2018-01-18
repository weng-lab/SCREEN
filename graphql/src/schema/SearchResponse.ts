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
    GraphQLUnionType,
    GraphQLInterfaceType
} from 'graphql';

import * as CommonTypes from './CommonSchema';
import * as DataResponseTypes from './DataResponse';

export const Gene = new GraphQLObjectType({
    name: 'Gene',
    fields: () => ({
        approved_symbol: { type: new GraphQLNonNull(GraphQLString) },
        oname: { type: new GraphQLNonNull(GraphQLString) },
        sm: { type: new GraphQLNonNull(GraphQLFloat) },
        range: { type: new GraphQLNonNull(CommonTypes.ChromRange) },
    })
});

export const SingleGeneResponse = new GraphQLObjectType({
    name: 'SingleGeneResponse',
    fields: () => ({
        gene: { type: Gene },
    }),
});

export const MultiGeneResponse = new GraphQLObjectType({
    name: 'MultiGeneResponse',
    fields: () => ({
        genes: { type: new GraphQLList(Gene) },
    }),
});

export const AccessionsResponse = new GraphQLObjectType({
    name: 'AccessionsResponse',
    fields: () => ({
        accessions: { type: new GraphQLList(GraphQLString) },
    }),
});

export const SNP = new GraphQLObjectType({
    name: 'SNP',
    fields: () => ({
        id: { type: new GraphQLNonNull(GraphQLString) },
        range: { type: new GraphQLNonNull(CommonTypes.ChromRange) }
    })
});

export const SNPsResponse = new GraphQLObjectType({
    name: 'SNPsResponse',
    fields: () => ({
        snps: { type: new GraphQLList(SNP) },
    }),
});

export const CellTypeResponse = new GraphQLObjectType({
    name: 'CellTypeResponse',
    fields: () => ({
        celltype: { type: GraphQLString },
    }),
});

export const RangeResponse = new GraphQLObjectType({
    name: 'RangeResponse',
    fields: () => ({
        range: { type:  CommonTypes.ChromRange },
    }),
});

export const FailedResponse = new GraphQLObjectType({
    name: 'FailedResponse',
    fields: () => ({
        failed: { type: GraphQLBoolean }
    }),
});

const resolveSearchResponse = d => {
    const gene = d.gene;
    const genes = d.genes;
    const accessions = d.accessions;
    const snps = d.snps;
    const cellType = d.cellType;
    const range = d.range;
    if (gene) {
        return SingleGeneResponse;
    }
    if (genes) {
        return MultiGeneResponse;
    }
    if (accessions && accessions.length > 0) {
        return AccessionsResponse;
    }
    if (snps && snps.length > 0) {
        return SNPsResponse;
    }
    if (cellType) {
        return CellTypeResponse;
    }
    if (range) {
        return RangeResponse;
    }
    return FailedResponse;
};

export const SearchResponse = new GraphQLUnionType({
    name: 'SearchResponse',
    types: [
        SingleGeneResponse,
        MultiGeneResponse,
        AccessionsResponse,
        SNPsResponse,
        CellTypeResponse,
        RangeResponse,
        FailedResponse
    ],
    resolveType: resolveSearchResponse
});

export default SearchResponse;
