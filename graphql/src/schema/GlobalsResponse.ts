import { GraphQLBoolean, GraphQLString, GraphQLList, GraphQLObjectType, GraphQLNonNull } from 'graphql';
import * as CommonTypes from './CommonSchema';
import { resolve_globals_assembly, resolve_help_key, resolve_ctinfo } from '../resolvers/globals';
const GraphQLJSON = require('graphql-type-json');

export const AssemblySpecificGlobalsResponse = new GraphQLObjectType({
    name: 'AssemblySpecificGlobals',
    description: 'Assembly-specific global data',
    fields: () => ({
        tfs: {
            description: 'A list of all transcription factors used',
            type: new GraphQLNonNull(new GraphQLList(new GraphQLNonNull(GraphQLString))),
        },
        cellCompartments: {
            description: 'A list of cell compartments',
            type: new GraphQLNonNull(new GraphQLList(new GraphQLNonNull(GraphQLString))),
        },
        cellTypeInfoArr: {
            description: 'Get info on all cell types used and assays used for ccRE data',
            type: new GraphQLList(new GraphQLNonNull(CommonTypes.CellTypeInfo)),
        },
        ctinfo: {
            description: 'Gets the info for a specific cell type. Can use "none" to return nothing.',
            type: CommonTypes.CellTypeInfo,
            args: {
                cellType: {
                    description: 'The cellType to get info for',
                    type: new GraphQLNonNull(GraphQLString),
                },
            },
            resolve: resolve_ctinfo,
        },
        chromCounts: {
            description: 'Returns the numbers of ccREs keyed by chromosome',
            type: GraphQLJSON,
        },
        chromLens: {
            description: 'Returns the length of each chromosome',
            type: GraphQLJSON,
        },
        creHistBins: {
            description: 'Returns the numbers of ccREs in each bin of a chromosome',
            type: GraphQLJSON,
        },
        geBiosampleTypes: {
            description: 'Returns biosample types available in gene expression',
            type: new GraphQLNonNull(new GraphQLList(new GraphQLNonNull(GraphQLString))),
        },
        geBiosamples: {
            description: 'Returns biosamples available in gene expression',
            type: new GraphQLNonNull(new GraphQLList(new GraphQLNonNull(GraphQLString))),
        },
        creBigBedsByCellType: {
            description: 'Returns the accessions of the celltype-specific bigBed files for ccREs on ENCODE',
            type: GraphQLJSON,
        },
        creFiles: {
            description: 'Returns info on the data used to create ccREs',
            type: GraphQLJSON,
        },
        inputData: {
            description: 'Returns info on the data used for SCREEN',
            type: GraphQLJSON,
        },
    }),
});

export const HelpKeys = new GraphQLObjectType({
    name: 'HelpKeys',
    fields: () => ({
        all: { type: GraphQLJSON },
        helpKey: {
            description: 'Provides the help text for a single helpKey',
            args: {
                key: { type: new GraphQLNonNull(GraphQLString) },
            },
            type: HelpKey,
            resolve: resolve_help_key,
        },
    }),
});

export const HelpKey = new GraphQLObjectType({
    name: 'HelpKey',
    description: 'Describes a response to a single helpkey',
    fields: () => ({
        title: { type: new GraphQLNonNull(GraphQLString) },
        summary: { type: new GraphQLNonNull(GraphQLString) },
    }),
});

export const GlobalsResponse = new GraphQLObjectType({
    name: 'Globals',
    description: 'Global data',
    fields: () => ({
        helpKeys: { type: new GraphQLNonNull(HelpKeys) },
        colors: { type: new GraphQLNonNull(GraphQLJSON) },
        files: { type: GraphQLJSON },
        inputData: { type: GraphQLJSON },
        byAssembly: {
            args: {
                assembly: { type: new GraphQLNonNull(CommonTypes.Assembly) },
            },
            type: new GraphQLNonNull(AssemblySpecificGlobalsResponse),
            resolve: resolve_globals_assembly,
        },
    }),
});

export default GlobalsResponse;
