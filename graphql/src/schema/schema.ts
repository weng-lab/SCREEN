import { gql } from 'apollo-server-express';
import { GraphQLResolverMap } from 'apollo-graphql';
import { buildFederatedSchema } from '@apollo/federation';

import { GraphQLBoolean, GraphQLList, GraphQLString, GraphQLObjectType, GraphQLSchema, GraphQLNonNull } from 'graphql';
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
        geneexp_search: {
            description: 'Get gene expression data',
            type: GeneExpResponse,
            args: {
                assembly: { type: new GraphQLNonNull(CommonTypes.Assembly) },
                gene: { type: new GraphQLNonNull(GraphQLString) },
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
                normalized: {
                    type: GraphQLBoolean,
                    description: 'Whether or not to return normalized RNA-seq data. Defaults to true.',
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
        genetop: {
            description: 'Get gene expression by biosample',
            type: new GraphQLList(new GraphQLNonNull(TopGenesReplicateData)),
            args: {
                assembly: { type: new GraphQLNonNull(CommonTypes.Assembly) },
                biosample: { type: new GraphQLNonNull(GraphQLString) },
                normalized: {
                    type: GraphQLBoolean,
                    description: 'Whether or not to return normalized RNA-seq data. Defaults to true.',
                },
            },
            resolve: resolve_genetop,
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

export const typeDefs = gql`
    type Query {
        "Get cCRE data"
        data(assembly: Assembly!, data: DataParameters, pagination: PaginationParameters): DataResponse
        "Get global data"
        globals: GlobalsResponse
        "Search differential expression data"
        de_search(assembly: Assembly!, gene: String!, ct1: String!, ct2: String!): DeResponse
    }

    enum Assembly {
        GRCh38
        mm10
    }

    "Parameters to define what ccREs should be returned from a DataResponse"
    input DataParameters {
        "A list of accessions to return"
        accessions: [String!]
        range: InputChromRange
        "Only return ccREs with max zscores for all available experiments that fall within specific ranges"
        expmaxs: InputExpMax
        "Only return ccREs with zscores for all available experiments that fall within specific ranges for the specified cell type"
        ctexps: InputCtExps
    }

    "Represents a range on a chromomsome."
    input InputChromRange {
        "Chromosome"
        chrom: String!
        "Start position or null if full chromosome"
        start: Int
        "End position or null if full chromosome"
        end: Int
    }

    input InputExpMax {
        TODO: String
    }

    input InputCtExps {
        TODO: String
    }

    "ADVANCED - you probably do not need this. offset + limit <= 10000; limit <= 1000; to access more data, refine your search"
    input PaginationParameters {
        "Default 0. Instead of starting at the first ccRE, return ccREs offsetted."
        offset: Int
        "Default 1000. Change the limit to the number of ccREs returned."
        limit: Int
        "The field to order by. If an ct-specific orderby is passed, but is not applicable to the ct (i.e. no data), then maxz will be used instead."
        orderBy: OrderBy
    }

    input OrderBy {
        TODO: String
    }

    type DataResponse {
        "Returns the total number of ccREs that match the parameters. However, for speed, only up to the top 1000 will be displayed"
        total: Int!
        "Returns the ccREs that match the parameters"
        ccres: [cCRE!]!
    }

    scalar Files
    scalar InputData

    type GlobalsResponse {
        files: Files
        inputData: InputData
        byAssembly(assembly: Assembly!): AssemblySpecificGlobalsResponse!
    }

    scalar ChromCounts
    scalar ChromLens
    scalar CreHistBins
    scalar CreBigBedsByCellType
    scalar CreFiles
    scalar AssemblyInputData

    type AssemblySpecificGlobalsResponse {
        "A list of all transcription factors used"
        tfs: [String!]!
        "A list of cell compartments"
        cellCompartments: [String!]!
        "Get info on all cell types used and assays used for ccRE data"
        cellTypeInfoArr: [CellTypeInfo!]
        "Gets the info for a specific cell type. Can use 'none' to return nothing."
        ctinfo(cellType: String!): CellTypeInfo
        "Returns the numbers of ccREs keyed by chromosome"
        chromCounts: ChromCounts
        "Returns the length of each chromosome"
        chromLens: ChromLens
        "Returns the numbers of ccREs in each bin of a chromosome"
        creHistBins: CreHistBins
        "Returns biosample types available in gene expression"
        geBiosampleTypes: [String!]!
        "Returns biosamples available in gene expression"
        geBiosamples: [String!]!
        "Returns the accessions of the celltype-specific bigBed files for ccREs on ENCODE"
        creBigBedsByCellType: CreBigBedsByCellType
        "Returns info on the data used to create ccREs"
        creFiles: CreFiles
        "Returns info on the data used for SCREEN"
        inputData: AssemblyInputData
    }

    type cCRE {
        "Assembly the ccRE is defined of"
        assembly: Assembly!
        "Accession of this ccRE"
        accession: String!
        "The range of the ccRE"
        range: ChromRange!
        "The max zscore from any experiment in any celltype"
        maxz: Float!
        "Max dnase zscore of all experiments"
        dnasemax: Float!
        "Max ctcf zscore of all experiments"
        ctcfmax: Float!
        "Max k27ac zscore of all experiments"
        k27acmax: Float!
        "Max k4me3 zscore of all experiments"
        k4me3max: Float!
        "Does this ccRE have an ortholog in other assemblies"
        concordant: Boolean!
        "Is ccRE +/- 2kb of TSS"
        isproximal: Boolean!
        "celltype-specific zscores"
        ctspecifc(ct: String!): CtSpecific
        "Nearby genes"
        nearbygenes: Genes!
        "Get details about this ccRE"
        details: CreDetails!
    }

    "Represents a range on a chromomsome. May optionally specify a strand."
    type ChromRange {
        "Chromosome"
        chrom: String!
        "Start position or null if full chromosome"
        start: Int
        "End position or null if full chromosome"
        end: Int
        "Strand of this range or null if not defined"
        strand: String
    }

    type CtSpecific {
        TODO: String
    }

    type Genes {
        TODO: String
    }

    type CreDetails {
        TODO: String
    }

    type CellTypeInfo {
        name: String
        value: String!
        tissue: String!
        displayName: String!
        isde: Boolean!
        synonyms: [String!]
        assays: [String!]
        cCREActivity(ccre: String!): CtSpecific
    }

    "Differential expression data"
    type DeResponse {
        gene: DeGene!
        diffcCREs: [DiffcCRE!]!
        "Null if there are no de genes"
        nearbyGenes: [DiffGene!]
        min: Int!
        max: Int!
    }

    "Gene info for de"
    type DeGene {
        "The coordinates of this gene"
        coords: ChromRange!
        "The gene name"
        gene: String!
        "The ensembl id and ver of the gene"
        ensemblid_ver: String!
    }

    type DiffcCRE {
        center: Float!
        value: Float!
        typ: String!
        cCRE: cCRE!
    }

    type DiffGene {
        isde: Boolean!
        fc: Float
        gene: DeGene!
    }
`;

export const resolvers: GraphQLResolverMap = {
    Query: {
        data: () => new Error(),
    },
};

export const generatedSchema = buildFederatedSchema([{ typeDefs }]);
