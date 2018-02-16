import {
    GraphQLObjectType,
    GraphQLList,
    GraphQLString,
    GraphQLNonNull
} from 'graphql';

export const SuggestionsResponse = new GraphQLObjectType({
    name: 'Suggestions',
    description: 'Get suggestions for a partial query',
    fields: () => ({
        suggestions: { type: new GraphQLNonNull(new GraphQLList(new GraphQLNonNull(GraphQLString))) },
    })
});

export default SuggestionsResponse;
