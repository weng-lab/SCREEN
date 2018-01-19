import {
    GraphQLString,
    GraphQLObjectType,
} from 'graphql';
const GraphQLJSON = require('graphql-type-json');

export const RampageResponse = new GraphQLObjectType({
    name: 'Rampage',
    fields: () => ({
        'sortedTranscripts': { type: GraphQLJSON },
        'tsss': { type: GraphQLJSON },
        'gene': { type: GraphQLJSON },
    })
});

export default RampageResponse;
