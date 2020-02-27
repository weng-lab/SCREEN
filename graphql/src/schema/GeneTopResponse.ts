import { GraphQLObjectType, GraphQLNonNull, GraphQLString, GraphQLFloat } from 'graphql';

export const TopGenesReplicateData = new GraphQLObjectType({
    name: 'TopGenesReplicateData',
    description: 'Gene exp data for a replicate in an experiment',
    fields: () => ({
        tissue: { type: new GraphQLNonNull(GraphQLString) },
        cellType: { type: new GraphQLNonNull(GraphQLString) },
        gene_name: { type: new GraphQLNonNull(GraphQLString) },
        expID: { type: new GraphQLNonNull(GraphQLString) },
        ageTitle: { type: new GraphQLNonNull(GraphQLString) },
        rID: { type: new GraphQLNonNull(GraphQLString) },
        replicate: { type: new GraphQLNonNull(GraphQLString) },
        rawTPM: { type: new GraphQLNonNull(GraphQLFloat) },
        logTPM: { type: new GraphQLNonNull(GraphQLFloat) },
        rawFPKM: { type: new GraphQLNonNull(GraphQLFloat) },
        logFPKM: { type: new GraphQLNonNull(GraphQLFloat) },
    }),
});
