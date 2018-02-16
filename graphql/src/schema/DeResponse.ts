import {
    GraphQLObjectType, GraphQLNonNull,
} from 'graphql';
import * as CommonTypes from './CommonSchema';
const GraphQLJSON = require('graphql-type-json');

export const DeResponse = new GraphQLObjectType({
    name: 'De',
    description: 'Differential expression data',
    fields: () => ({
        coord: { type: new GraphQLNonNull(CommonTypes.ChromRange) },
        diffCREs: { type: GraphQLJSON },
        nearbyDEs: { type: GraphQLJSON },
        xdomain: { type: GraphQLJSON },
    })
});

export default DeResponse;
