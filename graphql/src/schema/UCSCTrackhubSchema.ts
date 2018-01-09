import {
    GraphQLObjectType,
    GraphQLString,
    GraphQLInputObjectType,
    GraphQLNonNull,
    GraphQLList,
    GraphQLInt,
} from 'graphql';
import * as CommonTypes from './CommonSchema';
import { GraphQLBoolean } from 'graphql/type/scalars';
import { UUID } from './uuid';

export const UCSCTrackhubResponse = new GraphQLObjectType({
    name: 'UCSCTrackhub',
    fields: () => ({
        trackhuburl: { type: GraphQLString },
        url: { type: GraphQLString },
    })
});

export default UCSCTrackhubResponse;

export const UCSCTrackhubInfo = new GraphQLInputObjectType({
    name: 'UCSCTrackhubInfo',
    fields: () => ({
        accession: { type: new GraphQLNonNull(GraphQLString) },
        assembly: { type: new GraphQLNonNull(CommonTypes.Assembly) },
        cellTypes: { type: new GraphQLList(GraphQLString) },
        range: { type: CommonTypes.RequiredInputChromRange },
        halfWindow: { type: new GraphQLNonNull(GraphQLInt) },
        showCombo: { type: new GraphQLNonNull(GraphQLBoolean) },
        uuid: { type: new GraphQLNonNull(UUID) },
    })
});
