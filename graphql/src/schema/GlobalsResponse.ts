import {
    GraphQLBoolean,
    GraphQLString,
    GraphQLList,
    GraphQLObjectType,
    GraphQLNonNull,
} from 'graphql';
import * as CommonTypes from './CommonSchema';
import { resolve_globals_assembly } from '../resolvers/globals';
const GraphQLJSON = require('graphql-type-json');

export const CellTypeAssay = new GraphQLObjectType({
    name: 'CellTypeAssay',
    description: 'Info on a single assay from a cell type',
    fields: () => ({
        assay: { type: GraphQLString },
        expid: { type: GraphQLString },
        fileid: { type: GraphQLString },
        tissue: { type: GraphQLString },
        biosample_summary: { type: GraphQLString },
        biosample_type: { type: GraphQLString },
    })
});

export const CellTypeInfo = new GraphQLObjectType({
    name: 'CellTypeInfo',
    description: 'Info on every cell type used in SCREEN and in ccREs',
    fields: () => ({
        name: { type: GraphQLString },
        value: { type: GraphQLString },
        isde: { type: GraphQLBoolean },
        synonyms: { type: new GraphQLList(GraphQLString) },
        assays: { type: new GraphQLList(CellTypeAssay) },
    })
});

export const AssemblySpecificGlobalsResponse = new GraphQLObjectType({
    name: 'AssemblySpecificGlobals',
    description: 'Assembly-specific global data',
    fields: () => ({
        tfs: { type: GraphQLJSON },
        cellCompartments: { type: GraphQLJSON },
        cellTypeInfoArr: { type: new GraphQLList(CellTypeInfo) },
        chromCounts: { type: GraphQLJSON },
        chromLens: { type: GraphQLJSON },
        creHistBins: { type: GraphQLJSON },
        geBiosampleTypes: { type: GraphQLJSON },
        creBigBedsByCellType: { type: GraphQLJSON },
        creFiles: { type: GraphQLJSON },
        inputData: { type: GraphQLJSON },
    })
});

export const GlobalsResponse = new GraphQLObjectType({
    name: 'Globals',
    description: 'Global data',
    fields: () => ({
        helpKeys: { type: GraphQLJSON },
        colors: { type: GraphQLJSON },
        files: { type: GraphQLJSON },
        inputData: { type: GraphQLJSON },
        byAssembly: {
            args: {
                assembly: { type: new GraphQLNonNull(CommonTypes.Assembly) },
            },
            type: new GraphQLNonNull(AssemblySpecificGlobalsResponse),
            resolve: resolve_globals_assembly,
        }
    })
});

export default GlobalsResponse;
