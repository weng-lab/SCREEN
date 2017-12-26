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
    isTypeOf: d => !!d.gene
});

export const MultiGeneResponse = new GraphQLObjectType({
    name: 'MultiGeneResponse',
    interfaces: [SearchResponse],
    fields: () => ({
        uuid: { type: new GraphQLNonNull(GraphQLString) },
        assembly: { type: new GraphQLNonNull(CommonTypes.Assembly) },
        genes: { type: new GraphQLList(Gene) },
    }),
    isTypeOf: d => !!d.genes
});

export const AccessionsResponse = new GraphQLObjectType({
    name: 'AccessionsReponse',
    interfaces: [SearchResponse],
    fields: () => ({
        uuid: { type: new GraphQLNonNull(GraphQLString) },
        assembly: { type: new GraphQLNonNull(CommonTypes.Assembly) },
        accessions: { type: new GraphQLList(GraphQLString) },
    }),
    isTypeOf: d => !!d.accessions
});

export const SNPsResponse = new GraphQLObjectType({
    name: 'SNPsResponse',
    interfaces: [SearchResponse],
    fields: () => ({
        uuid: { type: new GraphQLNonNull(GraphQLString) },
        assembly: { type: new GraphQLNonNull(CommonTypes.Assembly) },
        snps: { type: new GraphQLList(GraphQLString) },
    }),
    isTypeOf: d => !!d.snps
});

export const CellTypeResponse = new GraphQLObjectType({
    name: 'CellTypeResponse',
    interfaces: [SearchResponse],
    fields: () => ({
        uuid: { type: new GraphQLNonNull(GraphQLString) },
        assembly: { type: new GraphQLNonNull(CommonTypes.Assembly) },
        celltype: { type: GraphQLString },
    }),
    isTypeOf: d => !!d.cellType
});
