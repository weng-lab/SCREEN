import {
    GraphQLBoolean,
    GraphQLList,
    GraphQLString,
    GraphQLInt,
    GraphQLFloat,
    GraphQLInputObjectType,
    GraphQLObjectType,
    GraphQLSchema,
    GraphQLID,
    GraphQLNonNull
} from 'graphql';
import * as CommonTypes from './CommonSchema';
import DataResponse from './DataResponse';
import SearchResponse from './SearchResponse';

const json = require('../../data.json');
const search_json = require('../../search.json');

const resolve_data = require('../resolvers/cretable').resolve_data;

const BaseType = new GraphQLObjectType({
    name: 'BaseType',
    fields: () => ({
        data: {
            description: 'Get cRE data',
            type: DataResponse,
            args: {
                search: { type: new GraphQLNonNull(CommonTypes.SearchParameters) },
                data: { type: new GraphQLNonNull(CommonTypes.DataParameters) }
            },
            resolve: resolve_data
        },
        search: {
            description: 'Perform a search',
            type: SearchResponse,
            args: {
                search: { type: CommonTypes.SearchParameters },
            },
            resolve: (root, args) => search_json
        }
    })
});

const schema = new GraphQLSchema({
    query: BaseType
});

export default schema;
