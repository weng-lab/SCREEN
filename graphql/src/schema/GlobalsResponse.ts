import { GraphQLBoolean, GraphQLString, GraphQLList, GraphQLObjectType, GraphQLNonNull } from 'graphql';
import * as CommonTypes from './CommonSchema';
import {
    resolve_globals_assembly,
    resolve_help_key,
    resolve_ctinfo,
    resolve_globals_assembly_tfs,
    resolve_globals_assembly_cellCompartments,
    resolve_globals_assembly_cellTypeInfoArr,
    resolve_globals_assembly_chromCounts,
    resolve_globals_assembly_chromLens,
    resolve_globals_assembly_creHistBins,
    resolve_globals_assembly_geBiosampleTypes,
    resolve_globals_assembly_geBiosamples,
    resolve_globals_assembly_creBigBedsByCellType,
    resolve_globals_assembly_creFiles,
    resolve_globals_assembly_inputData,
    resolve_globals_helpKeys,
    resolve_globals_colors,
    resolve_globals_files,
    resolve_globals_inputData,
} from '../resolvers/globals';

export const AssemblySpecificGlobalsResponse = new GraphQLObjectType({
    name: 'AssemblySpecificGlobals',
    description: 'Assembly-specific global data',
    fields: () =>
        ({
            tfs: {
                description: 'A list of all transcription factors used',
                type: new GraphQLNonNull(new GraphQLList(new GraphQLNonNull(GraphQLString))),
                resolve: resolve_globals_assembly_tfs,
            },
            cellCompartments: {
                description: 'A list of cell compartments',
                type: new GraphQLNonNull(new GraphQLList(new GraphQLNonNull(GraphQLString))),
                resolve: resolve_globals_assembly_cellCompartments,
            },
            cellTypeInfoArr: {
                description: 'Get info on all cell types used and assays used for ccRE data',
                type: new GraphQLList(new GraphQLNonNull(CommonTypes.CellTypeInfo as any)),
                resolve: resolve_globals_assembly_cellTypeInfoArr,
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
                type: GraphQLString, // JSON
                resolve: resolve_globals_assembly_chromCounts,
            },
            chromLens: {
                description: 'Returns the length of each chromosome',
                type: GraphQLString, // JSON
                resolve: resolve_globals_assembly_chromLens,
            },
            creHistBins: {
                description: 'Returns the numbers of ccREs in each bin of a chromosome',
                type: GraphQLString, // JSON
                resolve: resolve_globals_assembly_creHistBins,
            },
            geBiosampleTypes: {
                description: 'Returns biosample types available in gene expression',
                type: new GraphQLNonNull(new GraphQLList(new GraphQLNonNull(GraphQLString))),
                resolve: resolve_globals_assembly_geBiosampleTypes,
            },
            geBiosamples: {
                description: 'Returns biosamples available in gene expression',
                type: new GraphQLNonNull(new GraphQLList(new GraphQLNonNull(GraphQLString))),
                resolve: resolve_globals_assembly_geBiosamples,
            },
            creBigBedsByCellType: {
                description: 'Returns the accessions of the celltype-specific bigBed files for ccREs on ENCODE',
                type: GraphQLString, // JSON
                resolve: resolve_globals_assembly_creBigBedsByCellType,
            },
            creFiles: {
                description: 'Returns info on the data used to create ccREs',
                type: GraphQLString, // JSON
                resolve: resolve_globals_assembly_creFiles,
            },
            inputData: {
                description: 'Returns info on the data used for SCREEN',
                type: GraphQLString, // JSON
                resolve: resolve_globals_assembly_inputData,
            },
        } as any),
});

export const HelpKeys = new GraphQLObjectType({
    name: 'HelpKeys',
    fields: () => ({
        all: { type: GraphQLString }, // JSON
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
        helpKeys: {
            type: new GraphQLNonNull(HelpKeys),
            resolve: resolve_globals_helpKeys,
        },
        colors: {
            type: new GraphQLNonNull(GraphQLString), // JSON
            resolve: resolve_globals_colors,
        },
        files: {
            type: GraphQLString, // JSON
            resolve: resolve_globals_files,
        },
        inputData: {
            type: GraphQLString, // JSON
            resolve: resolve_globals_inputData,
        },
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
