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
    GraphQLInterfaceType,
} from 'graphql';

import * as CommonTypes from './CommonSchema';
import * as DataResponseTypes from './DataResponse';

const resolveSearchToken = d => {
    const gene = d.gene;
    const genes = d.genes;
    const accession = d.accession;
    const snp = d.snp;
    const celltype = d.celltype;
    const gecelltype = d.gecelltype;
    const range = d.range;
    if (gene) {
        return SingleGeneToken;
    }
    if (genes) {
        return MultiGeneToken;
    }
    if (accession) {
        return AccessionToken;
    }
    if (snp) {
        return SNPToken;
    }
    if (celltype) {
        return CellTypeToken;
    }
    if (gecelltype) {
        return GeCellTypeToken;
    }
    if (range) {
        return RangeToken;
    }
    return UnknownToken;
};

export const SearchToken = new GraphQLInterfaceType({
    name: 'SearchToken',
    description: 'Describes a specific token and the intepreted result',
    fields: () => ({
        input: {
            description: 'The input string that was interpreted',
            type: new GraphQLNonNull(GraphQLString),
        },
        assembly: {
            description: 'The assembly this token matches',
            type: new GraphQLNonNull(CommonTypes.Assembly),
        },
        sm: {
            description: 'The simlarity of the token to the input',
            type: new GraphQLNonNull(GraphQLFloat),
        },
    }),
    resolveType: resolveSearchToken,
});

export const Gene = new GraphQLObjectType({
    name: 'Gene',
    description: 'Information pertaining to a gene',
    fields: () => ({
        approved_symbol: {
            description: 'The approved_symbol for the gene',
            type: new GraphQLNonNull(GraphQLString),
        },
        oname: {
            description: 'TODO',
            type: new GraphQLNonNull(GraphQLString),
        },
        sm: {
            description: 'The similarity of this gene to the searched query',
            type: new GraphQLNonNull(GraphQLFloat),
        },
        range: {
            description: 'The range of this gene',
            type: new GraphQLNonNull(CommonTypes.ChromRange),
        },
        tssrange: {
            description: 'The range of this gene from the tss',
            type: new GraphQLNonNull(CommonTypes.ChromRange),
        },
    }),
});

export const SingleGeneToken = new GraphQLObjectType({
    name: 'SingleGeneToken',
    interfaces: [SearchToken],
    description:
        'Will be returned when the token exactly matches a single gene. ' +
        'Note that this does not necessarily mean that there are not other gene search tokens. These are usually separated with a separate space.',
    fields: () => ({
        input: {
            type: new GraphQLNonNull(GraphQLString),
        },
        assembly: { type: new GraphQLNonNull(CommonTypes.Assembly) },
        sm: { type: new GraphQLNonNull(GraphQLFloat) },
        gene: { type: new GraphQLNonNull(Gene) },
    }),
});

export const MultiGeneToken = new GraphQLObjectType({
    name: 'MultiGeneToken',
    interfaces: [SearchToken],
    description:
        'Will be returned when the token ambiguously matches multiple genes. ' +
        'Note that this does not necessarily mean that there are multiple different gene searches.',
    fields: () => ({
        input: {
            type: new GraphQLNonNull(GraphQLString),
        },
        assembly: { type: new GraphQLNonNull(CommonTypes.Assembly) },
        sm: { type: new GraphQLNonNull(GraphQLFloat) },
        genes: { type: new GraphQLNonNull(new GraphQLList(new GraphQLNonNull(Gene))) },
    }),
});

export const AccessionToken = new GraphQLObjectType({
    name: 'AccessionToken',
    interfaces: [SearchToken],
    description: 'Will be returned when the token matches a ccRE accession',
    fields: () => ({
        input: {
            type: new GraphQLNonNull(GraphQLString),
        },
        assembly: { type: new GraphQLNonNull(CommonTypes.Assembly) },
        sm: { type: new GraphQLNonNull(GraphQLFloat) },
        accession: { type: new GraphQLNonNull(GraphQLString) },
    }),
});

export const SNP = new GraphQLObjectType({
    name: 'SNP',
    description: 'A SNP',
    fields: () => ({
        id: {
            description: 'The SNP id',
            type: new GraphQLNonNull(GraphQLString),
        },
        range: {
            description: 'The range of this SNP',
            type: new GraphQLNonNull(CommonTypes.ChromRange),
        },
    }),
});

export const SNPToken = new GraphQLObjectType({
    name: 'SNPToken',
    interfaces: [SearchToken],
    description: 'Will be returned when the token matches a SNP',
    fields: () => ({
        input: {
            type: new GraphQLNonNull(GraphQLString),
        },
        assembly: { type: new GraphQLNonNull(CommonTypes.Assembly) },
        sm: { type: new GraphQLNonNull(GraphQLFloat) },
        snp: { type: new GraphQLNonNull(SNP) },
    }),
});

export const CellTypeToken = new GraphQLObjectType({
    name: 'CellTypeToken',
    interfaces: [SearchToken],
    description: 'Will be returned when the token matches a celltype',
    fields: () => ({
        input: {
            type: new GraphQLNonNull(GraphQLString),
        },
        assembly: { type: new GraphQLNonNull(CommonTypes.Assembly) },
        sm: { type: new GraphQLNonNull(GraphQLFloat) },
        celltype: { type: new GraphQLNonNull(GraphQLString) },
    }),
});

export const GeCellTypeToken = new GraphQLObjectType({
    name: 'GeCellTypeToken',
    interfaces: [SearchToken],
    description: 'Will be returned when the token matches a celltype from ge',
    fields: () => ({
        input: {
            type: new GraphQLNonNull(GraphQLString),
        },
        assembly: { type: new GraphQLNonNull(CommonTypes.Assembly) },
        sm: { type: new GraphQLNonNull(GraphQLFloat) },
        gecelltype: { type: new GraphQLNonNull(GraphQLString) },
    }),
});

export const RangeToken = new GraphQLObjectType({
    name: 'RangeToken',
    interfaces: [SearchToken],
    description: 'Will be returned when the token matches a range',
    fields: () => ({
        input: {
            type: new GraphQLNonNull(GraphQLString),
        },
        assembly: { type: new GraphQLNonNull(CommonTypes.Assembly) },
        sm: { type: new GraphQLNonNull(GraphQLFloat) },
        range: { type: new GraphQLNonNull(CommonTypes.ChromRange) },
    }),
});

export const UnknownToken = new GraphQLObjectType({
    name: 'UnknownToken',
    interfaces: [SearchToken],
    description: 'Will be returned if the token does not match anything',
    fields: () => ({
        input: {
            type: new GraphQLNonNull(GraphQLString),
        },
        assembly: { type: new GraphQLNonNull(CommonTypes.Assembly) },
        sm: { type: new GraphQLNonNull(GraphQLFloat) },
        failed: { type: new GraphQLNonNull(GraphQLBoolean) },
    }),
});

export default SearchToken;
