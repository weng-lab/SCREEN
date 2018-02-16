import {
    GraphQLObjectType,
    GraphQLList,
    GraphQLString,
    GraphQLNonNull
} from 'graphql';
import { resolve_gb_genetable, resolve_gb_trackhubs } from '../resolvers/gb';
import { InputChromRange } from './CommonSchema';
const GraphQLJSON = require('graphql-type-json');

export const GbResponse = new GraphQLObjectType({
    name: 'Gb',
    description: 'Genome browser data',
    fields: () => ({
        genetable: {
            type: GraphQLJSON,
            args: {
                range: { type: new GraphQLNonNull(InputChromRange) }
            },
            resolve: resolve_gb_genetable
        },
        trackhubs: {
            type: new GraphQLList(new GraphQLNonNull(GraphQLJSON)),
            resolve: resolve_gb_trackhubs
        }
    }),
});

export default GbResponse;
