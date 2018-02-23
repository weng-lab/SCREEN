import {
    GraphQLObjectType, GraphQLNonNull, GraphQLString,
} from 'graphql';
import * as CommonTypes from './CommonSchema';
const GraphQLJSON = require('graphql-type-json');

export const GeneTopResponse = new GraphQLObjectType({
    name: 'GeneTop',
    description: 'Gene Top Expression data',
    fields: () => ({
        biosample: { type: new GraphQLNonNull(GraphQLString) },
        ensemblid_ver: { type: new GraphQLNonNull(GraphQLString) },
        coords: { type: CommonTypes.ChromRange },
        single: { type: GraphQLJSON },
        mean: { type: GraphQLJSON },
        itemsByRID: { type: GraphQLJSON },
    })
});

export default GeneTopResponse;
