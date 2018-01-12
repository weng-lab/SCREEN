import {
    GraphQLObjectType, GraphQLNonNull,
} from 'graphql';
import * as CommonTypes from './CommonSchema';
import { resolve_globals_assembly } from '../resolvers/globals';
const GraphQLJSON = require('graphql-type-json');

export const AssemblySpecificGlobalsResponse = new GraphQLObjectType({
    name: 'AssemblySpecificGlobals',
    fields: () => ({
        tfs: { type: GraphQLJSON },
        cellCompartments: { type: GraphQLJSON },
        cellTypeInfoArr: { type: GraphQLJSON },
        chromCounts: { type: GraphQLJSON },
        chromLens: { type: GraphQLJSON },
        creHistBins: { type: GraphQLJSON },
        byCellType: { type: GraphQLJSON },
        geBiosampleTypes: { type: GraphQLJSON },
        creBigBedsByCellType: { type: GraphQLJSON },
        creFiles: { type: GraphQLJSON }
    })
})
export const GlobalsResponse = new GraphQLObjectType({
    name: 'Globals',
    fields: () => ({
        helpKeys: { type: GraphQLJSON },
        colors: { type: GraphQLJSON },
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
