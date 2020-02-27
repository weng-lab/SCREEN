import { GraphQLObjectType, GraphQLList, GraphQLString, GraphQLNonNull } from 'graphql';
import { resolve_gb_genetable, resolve_gb_trackhubs } from '../resolvers/gb';
import { InputChromRange } from './CommonSchema';

export const GbResponse = new GraphQLObjectType({
    name: 'Gb',
    description: 'Genome browser data',
    fields: () => ({
        genetable: {
            type: GraphQLString, // JSON
            args: {
                range: { type: new GraphQLNonNull(InputChromRange) },
            },
            resolve: resolve_gb_genetable,
        },
        trackhubs: {
            type: new GraphQLList(new GraphQLNonNull(GraphQLString)), // JSON
            resolve: resolve_gb_trackhubs,
        },
    }),
});

export default GbResponse;
