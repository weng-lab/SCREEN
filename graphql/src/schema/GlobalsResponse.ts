import {
    GraphQLObjectType,
} from 'graphql';
import * as CommonTypes from './CommonSchema';
const GraphQLJSON = require('graphql-type-json');

export const GlobalsResponse = new GraphQLObjectType({
    name: 'Globals',
    fields: () => ({
        tfs: { type: GraphQLJSON },
        cellCompartments: { type: GraphQLJSON },
        cellTypeInfoArr: { type: GraphQLJSON },
        chromCounts: { type: GraphQLJSON },
        chromLens: { type: GraphQLJSON },
        creHistBins: { type: GraphQLJSON },
        byCellType: { type: GraphQLJSON },
        geBiosampleTypes: { type: GraphQLJSON },
        helpKeys: { type: GraphQLJSON },
        colors: { type: GraphQLJSON },
        creBigBedsByCellType: { type: GraphQLJSON },
    })
});

export default GlobalsResponse;
