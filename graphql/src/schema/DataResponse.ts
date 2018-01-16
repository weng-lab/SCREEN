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
    fields: () => ({
        total: {
            description: 'TODO',
            type: new GraphQLNonNull(GraphQLInt),
        },
        cres: {
            description: 'TODO',
            type: new GraphQLNonNull(new GraphQLList(CommonTypes.cRE)),
        },
        rfacets: {
            description: 'TODO',
            type: new GraphQLNonNull(new GraphQLList(GraphQLString)),
        },
    })
});

export default DataResponse;