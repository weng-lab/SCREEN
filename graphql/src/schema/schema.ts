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
import GbResponse from './GbResponse';
import UCSCTrackhubResponse from './UCSCTrackhubSchema';
import * as SearchResponseTypes from './SearchResponse';
import UCSCTrackhubSchema, * as UCSCTrackhub from './UCSCTrackhubSchema';
import CreDetailsResponse from './CreDetailsResponse';
import RampageResponse from './RampageResponse';

import { resolve_data } from '../resolvers/cretable';
import { resolve_search } from '../resolvers/search';
import { resolve_globals } from '../resolvers/globals';
import { resolve_de } from '../resolvers/de';
import { resolve_geneexp } from '../resolvers/geneexp';
import { resolve_suggestions } from '../resolvers/suggestions';
import { resolve_gwas } from '../resolvers/gwas';
import { resolve_cart_set, resolve_cart_get } from '../resolvers/cart';
import { resolve_gb } from '../resolvers/gb';
import { resolve_ucsc_trackhub_url } from '../resolvers/ucsc_trackhub';
import { resolve_credetails } from '../resolvers/credetails';
import { resolve_rampage } from '../resolvers/rampage';

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
        },
        gb: {
            type: GbResponse,
            args: {
                assembly: { type: new GraphQLNonNull(CommonTypes.Assembly) },
            },
            resolve: resolve_gb
        },
        ucsc_trackhub_url: {
            type: UCSCTrackhubResponse,
            args: {
                uuid: { type: new GraphQLNonNull(UUID) },
                info: { type: new GraphQLNonNull(UCSCTrackhub.UCSCTrackhubInfo) }
            },
            resolve: resolve_ucsc_trackhub_url
        },
        credetails: {
            type: new GraphQLList(CreDetailsResponse),
            args: {
                accessions: { type: new GraphQLNonNull(new GraphQLList(GraphQLString)) }
            },
            resolve: resolve_credetails
        },
        rampage: {
            type: RampageResponse,
            args: {
                assembly: { type: new GraphQLNonNull(CommonTypes.Assembly) },
                gene: { type: new GraphQLNonNull(GraphQLString) }
            },
            resolve: resolve_rampage
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
        SearchResponseTypes.FailedResponse,
        UCSCTrackhub.UCSCTrackhubInfo,
    ],
    query: BaseType,
    mutation: BaseMutation
});

export default schema;
