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
    description: 'Information pertaining to a gene',
    fields: () => ({
        approved_symbol: {
            description: 'The approved_symbol for the gene',
            type: new GraphQLNonNull(GraphQLString)
        },
        oname: {
            description: 'TODO',
            type: new GraphQLNonNull(GraphQLString)
        },
        sm: {
            description: 'The similarity of this gene to the searched query',
            type: new GraphQLNonNull(GraphQLFloat)
        },
        range: {
            description: 'The range of this gene',
            type: new GraphQLNonNull(CommonTypes.ChromRange)
        },
    })
});

export const SingleGeneResponse = new GraphQLObjectType({
    name: 'SingleGeneResponse',
    description: 'Will be returned when the query exactly matches a single gene',
    fields: () => ({
        gene: { type: Gene },
    }),
});

export const MultiGeneResponse = new GraphQLObjectType({
    name: 'MultiGeneResponse',
    description: 'Will be returned when the query ambiguously matches multiple genes',
    fields: () => ({
        genes: { type: new GraphQLList(Gene) },
    }),
});

export const AccessionsResponse = new GraphQLObjectType({
    name: 'AccessionsResponse',
    description: 'Will be returned when the query matches one of more ccRE accessions',
    fields: () => ({
        accessions: { type: new GraphQLList(GraphQLString) },
    }),
});

export const SNP = new GraphQLObjectType({
    name: 'SNP',
    description: 'A SNP',
    fields: () => ({
        id: {
            description: 'The SNP id',
            type: new GraphQLNonNull(GraphQLString)
        },
        range: {
            description: 'The range of this SNP',
            type: new GraphQLNonNull(CommonTypes.ChromRange)
        }
    })
});

export const SNPsResponse = new GraphQLObjectType({
    name: 'SNPsResponse',
    description: 'Will be returned when the query matches one or more SNPs',
    fields: () => ({
        snps: { type: new GraphQLList(SNP) },
    }),
});

export const CellTypeResponse = new GraphQLObjectType({
    name: 'CellTypeResponse',
    description: 'Will be returned when the query matches a celltype',
    fields: () => ({
        celltype: { type: GraphQLString },
    }),
});

export const RangeResponse = new GraphQLObjectType({
    name: 'RangeResponse',
    description: 'Will be returned when the query matches a range',
    fields: () => ({
        range: { type:  CommonTypes.ChromRange },
    }),
});

export const FailedResponse = new GraphQLObjectType({
    name: 'FailedResponse',
    description: 'Will be returned if the query does not match anything',
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
    description: 'A response to a search query',
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
