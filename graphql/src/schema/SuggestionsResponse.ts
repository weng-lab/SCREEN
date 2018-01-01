import {
    GraphQLObjectType,
    GraphQLList,
    GraphQLString
} from 'graphql';

export const SuggestionsResponse = new GraphQLObjectType({
    name: 'Suggestions',
    fields: () => ({
        suggestions: { type: new GraphQLList(GraphQLString) },
    })
});

export default SuggestionsResponse;
