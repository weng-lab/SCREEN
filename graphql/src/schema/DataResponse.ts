import {
    GraphQLBoolean,
    GraphQLList,
    GraphQLString,
    GraphQLInt,
    GraphQLFloat,
    GraphQLObjectType,
    GraphQLSchema,
    GraphQLID,
    GraphQLNonNull
} from 'graphql';
import * as CommonTypes from './CommonSchema';


export const DataResponse = new GraphQLObjectType({
    name: 'Data',
    description: 'Get data specific by DataParameters',
    fields: () => ({
        total: {
            description: 'Returns the total number of ccREs that match the parameters. However, for speed, only up to the top 1000 will be displayed',
            type: new GraphQLNonNull(GraphQLInt),
        },
        cres: {
            description: 'Returns the ccREs that match the parameters',
            type: new GraphQLNonNull(new GraphQLList(new GraphQLNonNull(CommonTypes.cRE))),
        },
    })
});

export default DataResponse;