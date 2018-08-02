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
    GraphQLNonNull,
} from 'graphql';
import { UUID } from './uuid';
import * as CommonTypes from './CommonSchema';
import DataResponse from './DataResponse';
import SearchToken from './SearchResponse';
import GlobalsResponse from './GlobalsResponse';
import DeResponse from './DeResponse';
import GeneExpResponse from './GeneExpResponse';
import GwasResponse from './GwasResponse';
import CartResponse from './CartResponse';
import GbResponse from './GbResponse';
import UCSCTrackhubResponse from './UCSCTrackhubSchema';
import * as SearchResponseTypes from './SearchResponse';
import * as UCSCTrackhub from './UCSCTrackhubSchema';
import BedUploadResponse from './BedUploadResponse';
import { TopGenesReplicateData } from './GeneTopResponse';

import { resolve_data } from '../resolvers/cretable';
import { resolve_globals } from '../resolvers/globals';
import { resolve_search, resolve_suggestions } from '../resolvers/search';
import { resolve_de } from '../resolvers/de';
import { resolve_geneexp } from '../resolvers/geneexp';
import { resolve_gwas } from '../resolvers/gwas';
import { resolve_cart_set, resolve_cart_get } from '../resolvers/cart';
import { resolve_gb } from '../resolvers/gb';
import { resolve_ucsc_trackhub_url } from '../resolvers/ucsc_trackhub';
import { resolve_credetails } from '../resolvers/credetails';
import { resolve_rampage } from '../resolvers/rampage';
import { resolve_bedupload } from '../resolvers/bedupload';
import { resolve_genetop } from '../resolvers/genetop';
import { resolve_snps } from '../resolvers/snp';
import { RampageGeneData } from './CreDetailsResponse';

const json = require('../../data.json');
const search_json = require('../../search.json');

const BaseType = new GraphQLObjectType({
    name: 'BaseType',
    description: 'An API to access various data related to ccREs',
    fields: () => ({
        data: {
            description: 'Get cRE data',
            type: DataResponse,
            args: {
                assembly: { type: new GraphQLNonNull(CommonTypes.Assembly) },
                data: { type: CommonTypes.DataParameters },
                pagination: { type: CommonTypes.PaginationParameters },
            },
            resolve: resolve_data,
        },
        search: {
            description: 'Perform a search. Returns a list of search tokens and their interpreted meaning.',
            type: new GraphQLList(new GraphQLNonNull(SearchToken)),
            args: {
                assembly: { type: CommonTypes.Assembly },
                search: { type: CommonTypes.SearchParameters },
            },
            resolve: resolve_search,
        },
        globals: {
            description: 'Get global data',
            type: GlobalsResponse,
            resolve: resolve_globals,
        },
        de_search: {
            description: 'Search differential expression data',
            type: DeResponse,
            args: {
                assembly: { type: new GraphQLNonNull(CommonTypes.Assembly) },
                gene: { type: new GraphQLNonNull(GraphQLString) },
                ct1: { type: new GraphQLNonNull(GraphQLString) },
                ct2: { type: new GraphQLNonNull(GraphQLString) },
            },
            resolve: resolve_de,
        },
        geneexp: {
            description: 'Get gene expression data',
            type: GeneExpResponse,
            args: {
                assembly: { type: new GraphQLNonNull(CommonTypes.Assembly) },
                gene: {
                    type: GraphQLString,
                    description: 'The gene to limit gene expression data to',
                },
                biosample: {
                    type: GraphQLString,
                    description:
                        'The biosample to limit gene expression data to. If no gene is specified, then only data for genes that are within the top 1000 for all experiments will be shown. This typically is around 100-200 non-duplicate genes.',
                },
                biosample_types: {
                    type: new GraphQLList(new GraphQLNonNull(GraphQLString)),
                    description:
                        'A list of biosamples types to filter by. By default, will include all available biosample types. Available biosample types can be queried with {globals{byAssembly{geBiosampleTypes}}}',
                },
                compartments: {
                    type: new GraphQLList(new GraphQLNonNull(GraphQLString)),
                    description:
                        'A list of compartments to filter by. By default, will include all available compartments. Available compartments can be queried with {globals{byAssembly{cellCompartments}}}',
                },
                experimentaccession: {
                    type: GraphQLString,
                    description: 'The experiment to show the top genes for',
                },
                normalized: {
                    type: GraphQLBoolean,
                    description: 'Whether or not to return normalized RNA-seq data. Defaults to true.',
                },
                pconly: {
                    type: GraphQLBoolean,
                    description:
                        'If true, will only return protein-coding genes. If false or null, will return all genes',
                },
                nomitochondrial: {
                    type: GraphQLBoolean,
                    description:
                        'If true, will not return any mitochondrial genes. If false or null, will return all genes.',
                },
            },
            resolve: resolve_geneexp,
        },
        suggestions: {
            description: 'Get suggestions for a partial query',
            type: new GraphQLList(new GraphQLNonNull(SearchToken)),
            args: {
                query: { type: new GraphQLNonNull(GraphQLString) },
                assemblies: { type: new GraphQLList(CommonTypes.Assembly) },
            },
            resolve: resolve_suggestions,
        },
        gwas: {
            description: 'Get GWAS data',
            type: GwasResponse,
            args: {
                assembly: { type: new GraphQLNonNull(CommonTypes.Assembly) },
            },
            resolve: resolve_gwas,
        },
        get_cart: {
            description: 'Get the current cart',
            type: CartResponse,
            args: {
                uuid: { type: new GraphQLNonNull(UUID) },
            },
            resolve: resolve_cart_get,
        },
        gb: {
            description: 'Get genome browser data',
            type: GbResponse,
            args: {
                assembly: { type: new GraphQLNonNull(CommonTypes.Assembly) },
            },
            resolve: resolve_gb,
        },
        ucsc_trackhub_url: {
            description: 'Get a UCSC trackhub url',
            type: UCSCTrackhubResponse,
            args: {
                uuid: { type: new GraphQLNonNull(UUID) },
                info: { type: new GraphQLNonNull(UCSCTrackhub.UCSCTrackhubInfo) },
            },
            resolve: resolve_ucsc_trackhub_url,
        },
        credetails: {
            description: 'Get details for specific ccREs',
            type: CommonTypes.cRE,
            args: {
                accession: { type: new GraphQLNonNull(GraphQLString) },
            },
            resolve: resolve_credetails,
        },
        rampage: {
            description: 'Get RAMPAGE data for a gene',
            type: RampageGeneData,
            args: {
                assembly: { type: new GraphQLNonNull(CommonTypes.Assembly) },
                gene: { type: new GraphQLNonNull(GraphQLString) },
            },
            resolve: resolve_rampage,
        },
        bedupload: {
            description: 'Intersect a bed file with ccREs',
            type: BedUploadResponse,
            args: {
                uuid: { type: new GraphQLNonNull(UUID) },
                bedname: { type: GraphQLString },
                lines: {
                    description: 'The lines of a bed file',
                    type: new GraphQLNonNull(new GraphQLList(new GraphQLNonNull(GraphQLString))),
                },
                assembly: { type: new GraphQLNonNull(CommonTypes.Assembly) },
            },
            resolve: resolve_bedupload,
        },
        snps: {
            type: new GraphQLList(new GraphQLNonNull(CommonTypes.SNP)),
            args: {
                assembly: { type: CommonTypes.Assembly },
                id: { type: GraphQLString },
                range: { type: CommonTypes.InputChromRange },
            },
            resolve: resolve_snps,
        },
    }),
});

const BaseMutation = new GraphQLObjectType({
    name: 'BaseMutation',
    fields: () => ({
        set_cart: {
            description: 'Set a cart to a specific set of accessions',
            type: CartResponse,
            args: {
                uuid: { type: new GraphQLNonNull(UUID) },
                accessions: { type: new GraphQLNonNull(new GraphQLList(new GraphQLNonNull(GraphQLString))) },
            },
            resolve: resolve_cart_set,
        },
    }),
});

const schema = new GraphQLSchema({
    types: [
        CommonTypes.Assembly,
        UUID,
        SearchResponseTypes.AccessionToken,
        SearchResponseTypes.BiosampleToken,
        SearchResponseTypes.MultiGeneToken,
        SearchResponseTypes.SingleGeneToken,
        SearchResponseTypes.SNPToken,
        SearchResponseTypes.RangeToken,
        SearchResponseTypes.UnknownToken,
        UCSCTrackhub.UCSCTrackhubInfo,
    ],
    query: BaseType,
    mutation: BaseMutation,
});

export default schema;
