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
    description: 'Create a UCSC trackhub link',
    fields: () => ({
        trackhuburl: {
            description: 'The trackhub url to provide to the UCSC genome browser',
            type: new GraphQLNonNull(GraphQLString)
        },
        url: {
            description: 'The url to directly view the trackhub in the browser',
            type: new GraphQLNonNull(GraphQLString)
        },
    })
});

export default UCSCTrackhubResponse;

export const UCSCTrackhubInfo = new GraphQLInputObjectType({
    name: 'UCSCTrackhubInfo',
    description: 'Input information for what to display in the UCSC genome browser',
    fields: () => ({
        accession: {
            description: 'ccRE accession',
            type: new GraphQLNonNull(GraphQLString)
        },
        assembly: {
            description: 'Assembly',
            type: new GraphQLNonNull(CommonTypes.Assembly)
        },
        cellTypes: {
            description: 'Celltypes to display available data for',
            type: new GraphQLList(GraphQLString)
        },
        range: {
            description: 'Range to display',
            type: new GraphQLNonNull(CommonTypes.RequiredInputChromRange)
        },
        halfWindow: {
            description: 'TODO',
            type: new GraphQLNonNull(GraphQLInt)
        },
        showCombo: {
            description: 'TODO',
            type: new GraphQLNonNull(GraphQLBoolean)
        },
    })
});
