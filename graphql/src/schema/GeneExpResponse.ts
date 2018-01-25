import {
    GraphQLString,
    GraphQLObjectType,
} from 'graphql';
import * as CommonTypes from './CommonSchema';
const GraphQLJSON = require('graphql-type-json');

export const GeneExpResponse = new GraphQLObjectType({
    name: 'GeneExp',
    description: 'Gene expression data',
    fields: () => ({
        coords: { type: CommonTypes.ChromRange },
        gene: { type: GraphQLString },
        ensemblid_ver: { type: GraphQLString },
        itemsByRID: { type: GraphQLJSON },
        mean: { type: GraphQLJSON },
        single: { type: GraphQLJSON },
    })
});

export default GeneExpResponse;
