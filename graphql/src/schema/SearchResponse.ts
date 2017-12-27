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
}

export const SearchResponse = new GraphQLInterfaceType({
    name: 'SearchResponse',
    fields: () => ({
        uuid: {
            description: 'TODO',
            type: new GraphQLNonNull(GraphQLString),
        },
        assembly: {
            description: 'TODO',
            type: new GraphQLNonNull(CommonTypes.Assembly)
        },
    }),
    resolveType: resolveSearchResponse
});

export default SearchResponse;

export const Gene = new GraphQLObjectType({
    name: 'Gene',
    fields: () => ({
        approved_symbol: { type: new GraphQLNonNull(GraphQLString) },
        range: { type: CommonTypes.ChromRange },
        sm: { type: new GraphQLNonNull(GraphQLFloat) },
    })
});

export const SingleGeneResponse = new GraphQLObjectType({
    name: 'SingleGeneResponse',
    interfaces: [SearchResponse],
    fields: () => ({
        uuid: { type: new GraphQLNonNull(GraphQLString) },
        assembly: { type: new GraphQLNonNull(CommonTypes.Assembly) },
        gene: { type: Gene },
    }),
});

export const MultiGeneResponse = new GraphQLObjectType({
    name: 'MultiGeneResponse',
    interfaces: [SearchResponse],
    fields: () => ({
        uuid: { type: new GraphQLNonNull(GraphQLString) },
        assembly: { type: new GraphQLNonNull(CommonTypes.Assembly) },
        genes: { type: new GraphQLList(Gene) },
    }),
});

export const AccessionsResponse = new GraphQLObjectType({
    name: 'AccessionsResponse',
    interfaces: [SearchResponse],
    fields: () => ({
        uuid: { type: new GraphQLNonNull(GraphQLString) },
        assembly: { type: new GraphQLNonNull(CommonTypes.Assembly) },
        accessions: { type: new GraphQLList(GraphQLString) },
    }),
});

export const SNPsResponse = new GraphQLObjectType({
    name: 'SNPsResponse',
    interfaces: [SearchResponse],
    fields: () => ({
        uuid: { type: new GraphQLNonNull(GraphQLString) },
        assembly: { type: new GraphQLNonNull(CommonTypes.Assembly) },
        snps: { type: new GraphQLList(GraphQLString) },
    }),
});

export const CellTypeResponse = new GraphQLObjectType({
    name: 'CellTypeResponse',
    interfaces: [SearchResponse],
    fields: () => ({
        uuid: { type: new GraphQLNonNull(GraphQLString) },
        assembly: { type: new GraphQLNonNull(CommonTypes.Assembly) },
        celltype: { type: GraphQLString },
    }),
});

export const RangeResponse = new GraphQLObjectType({
    name: 'RangeResponse',
    interfaces: [SearchResponse],
    fields: () => ({
        uuid: { type: new GraphQLNonNull(GraphQLString) },
        assembly: { type: new GraphQLNonNull(CommonTypes.Assembly) },
        range: { type:  CommonTypes.ChromRange },
    }),
});

export const FailedResponse = new GraphQLObjectType({
    name: 'FailedResponse',
    interfaces: [SearchResponse],
    fields: () => ({
        uuid: { type: new GraphQLNonNull(GraphQLString) },
        assembly: { type: new GraphQLNonNull(CommonTypes.Assembly) },
    }),
});
