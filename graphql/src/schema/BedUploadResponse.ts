import { GraphQLString, GraphQLObjectType, GraphQLNonNull, GraphQLList } from 'graphql';
import { Assembly } from '../schema/CommonSchema';

const GraphQLJSON = require('graphql-type-json');

export const BedUploadResponse = new GraphQLObjectType({
    name: 'BedUploadResponse',
    description: 'Bed intersections',
    fields: () => ({
        assembly: { type: new GraphQLNonNull(Assembly) },
        accessions: { type: new GraphQLNonNull(new GraphQLList(new GraphQLNonNull(GraphQLString))) },
    }),
});

export default BedUploadResponse;
