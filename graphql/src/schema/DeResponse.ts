import {
    GraphQLObjectType,
    GraphQLNonNull,
    GraphQLInt,
    GraphQLFloat,
    GraphQLString,
    GraphQLList,
    GraphQLBoolean,
} from 'graphql';
import * as CommonTypes from './CommonSchema';
const GraphQLJSON = require('graphql-type-json');

export const DiffCCRE = new GraphQLObjectType({
    name: 'DiffCCRE',
    fields: () => ({
        center: { type: new GraphQLNonNull(GraphQLFloat) },
        value: { type: new GraphQLNonNull(GraphQLFloat) },
        typ: { type: new GraphQLNonNull(GraphQLString) },
        ccRE: { type: new GraphQLNonNull(CommonTypes.ccRE) },
    }),
});

export const DeResponse = new GraphQLObjectType({
    name: 'De',
    description: 'Differential expression data',
    fields: () => ({
        gene: { type: new GraphQLNonNull(CommonTypes.Gene) },
        diffCREs: { type: new GraphQLNonNull(new GraphQLList(new GraphQLNonNull(DiffCCRE))) },
        nearbyGenes: {
            type: new GraphQLList(new GraphQLNonNull(DifferentialExpression)),
            description: 'Null if there are no de genes',
        },
        min: { type: new GraphQLNonNull(GraphQLInt) },
        max: { type: new GraphQLNonNull(GraphQLInt) },
    }),
});

export const DifferentialExpression = new GraphQLObjectType({
    name: 'DifferentialExpression',
    description: 'Differential expression data for a given gene between two cell types',
    fields: () => ({
        isde: { type: new GraphQLNonNull(GraphQLBoolean) },
        fc: { type: GraphQLFloat },
        gene: { type: new GraphQLNonNull(CommonTypes.Gene) },
        ct1: { type: new GraphQLNonNull(GraphQLString) },
        ct2: { type: new GraphQLNonNull(GraphQLString) },
    }),
});

export default DeResponse;
