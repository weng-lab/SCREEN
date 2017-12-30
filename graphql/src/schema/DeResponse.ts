import {
    GraphQLObjectType,
} from 'graphql';
import * as CommonTypes from './CommonSchema';
const GraphQLJSON = require('graphql-type-json');

export const DeResponse = new GraphQLObjectType({
    name: 'De',
    fields: () => ({
        coord: { type: CommonTypes.ChromRange },
        diffCREs: { type: GraphQLJSON },
        nearbyDEs: { type: GraphQLJSON },
        xdomain: { type: GraphQLJSON },
    })
});

export default DeResponse;
