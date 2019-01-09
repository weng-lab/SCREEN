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

export const DeGene = new GraphQLObjectType({
    name: 'DeGene',
    description: 'Gene info for de',
    fields: () => ({
        coords: {
            type: new GraphQLNonNull(CommonTypes.ChromRange),
            description: 'The coordinates of this gene',
        },
        gene: {
            type: new GraphQLNonNull(GraphQLString),
            description: 'The gene name',
        },
        ensemblid_ver: {
            type: new GraphQLNonNull(GraphQLString),
            description: 'The ensembl id and ver of the gene',
        },
    }),
});

export const DiffCCRE = new GraphQLObjectType({
    name: 'DiffCCRE',
    fields: () => ({
        center: { type: new GraphQLNonNull(GraphQLFloat) },
        value: { type: new GraphQLNonNull(GraphQLFloat) },
        typ: { type: new GraphQLNonNull(GraphQLString) },
        ccRE: { type: new GraphQLNonNull(CommonTypes.ccRE) },
    }),
});

export const DiffGene = new GraphQLObjectType({
    name: 'DiffGene',
    fields: () => ({
        isde: { type: new GraphQLNonNull(GraphQLBoolean) },
        fc: { type: GraphQLFloat },
        gene: { type: new GraphQLNonNull(DeGene) },
    }),
});

export const DeResponse = new GraphQLObjectType({
    name: 'De',
    description: 'Differential expression data',
    fields: () => ({
        gene: { type: new GraphQLNonNull(DeGene) },
        diffCREs: { type: new GraphQLNonNull(new GraphQLList(new GraphQLNonNull(DiffCCRE))) },
        nearbyGenes: {
            type: new GraphQLList(new GraphQLNonNull(DiffGene)),
            description: 'Null if there are no de genes',
        },
        min: { type: new GraphQLNonNull(GraphQLInt) },
        max: { type: new GraphQLNonNull(GraphQLInt) },
    }),
});

export default DeResponse;
