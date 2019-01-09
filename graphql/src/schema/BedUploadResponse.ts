import { GraphQLString, GraphQLObjectType, GraphQLNonNull, GraphQLList } from 'graphql';
import { Assembly, ccRE } from '../schema/CommonSchema';

const GraphQLJSON = require('graphql-type-json');

export const BedUploadResponse = new GraphQLObjectType({
    name: 'BedUploadResponse',
    description: 'Bed intersections',
    fields: () => ({
        bedname: {
            type: new GraphQLNonNull(GraphQLString),
            description: 'The passed bed name, or a random uuid if no bed name was passed',
        },
        assembly: { type: new GraphQLNonNull(Assembly) },
        ccREs: { type: new GraphQLNonNull(new GraphQLList(new GraphQLNonNull(ccRE))) },
    }),
});

export default BedUploadResponse;
