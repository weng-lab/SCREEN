import {
    GraphQLString,
    GraphQLObjectType,
    GraphQLNonNull,
} from 'graphql';
import * as CommonTypes from './CommonSchema';
const GraphQLJSON = require('graphql-type-json');

export const GeneExpResponse = new GraphQLObjectType({
    name: 'GeneExp',
    description: 'Gene expression data',
    fields: () => ({
        coords: { type: new GraphQLNonNull(CommonTypes.ChromRange) },
        gene: { type: new GraphQLNonNull(GraphQLString) },
        ensemblid_ver: { type: new GraphQLNonNull(GraphQLString) },
        itemsByRID: { type: new GraphQLNonNull(GraphQLJSON) },
        mean: { type: new GraphQLNonNull(GraphQLJSON) },
        single: { type: new GraphQLNonNull(GraphQLJSON) },
    })
});

export default GeneExpResponse;
