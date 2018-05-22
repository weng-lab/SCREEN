import { GraphQLObjectType, GraphQLList, GraphQLString, GraphQLNonNull } from 'graphql';
import { Assembly } from './CommonSchema';

export const Suggestion = new GraphQLObjectType({
    name: 'Suggestion',
    fields: () => ({
        assembly: {
            type: new GraphQLNonNull(Assembly),
        },
        suggestion: {
            type: new GraphQLNonNull(GraphQLString),
        },
        type: {
            type: new GraphQLNonNull(GraphQLString),
        },
    }),
});
