import {
    GraphQLString,
    GraphQLObjectType,
    GraphQLNonNull,
    GraphQLList,
} from 'graphql';
import { Assembly } from '../schema/CommonSchema';
import { resolve_beduploadassembly } from '../resolvers/bedupload';

const GraphQLJSON = require('graphql-type-json');

export const BedUploadAssemblyResponse = new GraphQLObjectType({
    name: 'BedUploadAssemblyResponse',
    description: 'Bed intersections from an assembly',
    fields: () => ({
        'assembly': { type: new GraphQLNonNull(Assembly)},
        'accessions': { type: new GraphQLNonNull(new GraphQLList(GraphQLString)) },
    })
});

export const BedUploadResponse = new GraphQLObjectType({
    name: 'BedUploadResponse',
    description: 'Bed intersections',
    fields: () => ({
        'intersections': {
            type: new GraphQLNonNull(new GraphQLList(BedUploadAssemblyResponse)),
            resolve: resolve_beduploadassembly
        },
    })
});

export default BedUploadResponse;
