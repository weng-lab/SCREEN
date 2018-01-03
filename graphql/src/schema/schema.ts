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
import GlobalsResponse from './GlobalsResponse';
import DeResponse from './DeResponse';
import GeneExpResponse from './GeneExpResponse';
import SuggestionsResponse from './SuggestionsResponse';
import GwasResponse from './GwasResponse';
import CartResponse from './CartResponse';
import * as SearchResponseTypes from './SearchResponse';

import { resolve_data } from '../resolvers/cretable';
import { resolve_search } from '../resolvers/search';
import { resolve_globals } from '../resolvers/globals';
import { resolve_de } from '../resolvers/de';
import { resolve_geneexp } from '../resolvers/geneexp';
import { resolve_suggestions } from '../resolvers/suggestions';
import { resolve_gwas } from '../resolvers/gwas';
import { resolve_cart_set, resolve_cart_get } from '../resolvers/cart';

const json = require('../../data.json');
const search_json = require('../../search.json');


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
        },
        globals: {
            type: GlobalsResponse,
            args: {
                assembly: { type: new GraphQLNonNull(CommonTypes.Assembly) },
            },
            resolve: resolve_globals
        },
        de_search: {
            type: DeResponse,
            args: {
                assembly: { type: new GraphQLNonNull(CommonTypes.Assembly) },
                gene: { type: new GraphQLNonNull(GraphQLString) },
                ct1: { type: new GraphQLNonNull(GraphQLString) },
                ct2: { type: new GraphQLNonNull(GraphQLString) },
            },
            resolve: resolve_de
        },
        geneexp_search: {
            type: GeneExpResponse,
            args: {
                assembly: { type: new GraphQLNonNull(CommonTypes.Assembly) },
                gene: { type: new GraphQLNonNull(GraphQLString) },
                biosample_types: { type: new GraphQLNonNull(new GraphQLList(GraphQLString)) },
                compartments: { type: new GraphQLNonNull(new GraphQLList(GraphQLString)) },
            },
            resolve: resolve_geneexp
        },
        suggestions: {
            type: SuggestionsResponse,
            args: {
                query: { type: new GraphQLNonNull(GraphQLString) },
                assemblies: { type: new GraphQLList(CommonTypes.Assembly) }
            },
            resolve: resolve_suggestions
        },
        gwas: {
            type: GwasResponse,
            args: {
                assembly: { type: new GraphQLNonNull(CommonTypes.Assembly) }
            },
            resolve: resolve_gwas
        },
        get_cart: {
            type: CartResponse,
            args: {
                uuid: { type: new GraphQLNonNull(UUID) },
            },
            resolve: resolve_cart_get
        }
    })
});

const BaseMutation = new GraphQLObjectType({
    name: 'BaseMutation',
    fields: () => ({
        set_cart: {
            type: CartResponse,
            args: {
                uuid: { type: new GraphQLNonNull(UUID) },
                accessions: { type: new GraphQLNonNull(new GraphQLList(GraphQLString)) }
            },
            resolve: resolve_cart_set
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
    query: BaseType,
    mutation: BaseMutation
});

export default schema;
