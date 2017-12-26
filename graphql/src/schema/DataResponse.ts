import {
    GraphQLBoolean,
    GraphQLList,
    GraphQLString,
    GraphQLInt,
    GraphQLFloat,
    GraphQLObjectType,
    GraphQLSchema,
    GraphQLID,
    GraphQLNonNull
} from 'graphql';
import * as CommonTypes from './CommonSchema';


export const cREInfo = new GraphQLObjectType({
    name: 'info',
    fields: {
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

export const cREData = new GraphQLObjectType({
    name: 'creData',
    fields: () => ({
        range: { type: CommonTypes.ChromRange },
        maxz: { type: new GraphQLNonNull(GraphQLFloat) },
        ctcf_zscore: { type: new GraphQLNonNull(GraphQLFloat) },
        ctspecifc: { type: new GraphQLNonNull(new GraphQLList(GraphQLString)) },
        enhancer_zscore: { type: new GraphQLNonNull(GraphQLFloat) },
        promoter_zscore: { type: new GraphQLNonNull(GraphQLFloat) },
        genesallpc: { type: new GraphQLNonNull(genes) },
        dnase_zscore: { type: new GraphQLNonNull(GraphQLFloat) },
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

export const DataResponse = new GraphQLObjectType({
    name: 'Data',
    fields: () => ({
        total: {
            description: 'TODO',
            type: new GraphQLNonNull(GraphQLInt),
        },
        cres: {
            description: 'TODO',
            type: new GraphQLNonNull(new GraphQLList(cRE)),
        },
        rfacets: {
            description: 'TODO',
            type: new GraphQLNonNull(new GraphQLList(GraphQLString)),
        },
    })
});

export default DataResponse;