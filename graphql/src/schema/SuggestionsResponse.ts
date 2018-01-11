import {
    GraphQLObjectType,
    GraphQLList,
    GraphQLString,
    GraphQLNonNull
} from 'graphql';

export const SuggestionsResponse = new GraphQLObjectType({
    name: 'Suggestions',
    fields: () => ({
        suggestions: { type: new GraphQLNonNull(new GraphQLList(GraphQLString)) },
    })
});

export default SuggestionsResponse;
