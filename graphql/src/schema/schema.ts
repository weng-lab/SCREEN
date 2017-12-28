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
import { UUID } from './uuid';
import * as CommonTypes from './CommonSchema';
import DataResponse from './DataResponse';
import SearchResponse from './SearchResponse';
import * as SearchResponseTypes from './SearchResponse';

const json = require('../../data.json');
const search_json = require('../../search.json');

const resolve_data = require('../resolvers/cretable').resolve_data;
const resolve_search = require('../resolvers/search').resolve_search;


const BaseType = new GraphQLObjectType({
    name: 'BaseType',
    fields: () => ({
        data: {
            description: 'Get cRE data',
            type: DataResponse,
            args: {
                assembly: { type: new GraphQLNonNull(CommonTypes.Assembly) },
                uuid: { type: new GraphQLNonNull(UUID) },
                search: { type: CommonTypes.SearchParameters },
                data: { type: CommonTypes.DataParameters },
                pagination: { type: CommonTypes.PaginationParameters }
            },
            resolve: resolve_data
        },
        search: {
            description: 'Perform a search',
            type: SearchResponse,
            args: {
                assembly: { type: new GraphQLNonNull(CommonTypes.Assembly) },
                uuid: { type: new GraphQLNonNull(UUID) },
                search: { type: CommonTypes.SearchParameters },
            },
            resolve: resolve_search
        }
    })
});

const schema = new GraphQLSchema({
    types: [
        CommonTypes.Assembly,
        UUID,
        SearchResponseTypes.AccessionsResponse,
        SearchResponseTypes.CellTypeResponse,
        SearchResponseTypes.MultiGeneResponse,
        SearchResponseTypes.SingleGeneResponse,
        SearchResponseTypes.SNPsResponse,
        SearchResponseTypes.RangeResponse,
        SearchResponseTypes.FailedResponse
    ],
    query: BaseType
});

export default schema;
