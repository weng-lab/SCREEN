import { GraphQLObjectType, GraphQLNonNull, GraphQLList, GraphQLString } from 'graphql';
import * as CommonTypes from './CommonSchema';

export const CartResponse = new GraphQLObjectType({
    name: 'Cart',
    fields: () => ({
        cres: {
            description: 'A list of accessions in the cart',
            type: new GraphQLNonNull(new GraphQLList(new GraphQLNonNull(CommonTypes.ccRE))),
        },
    }),
});

export default CartResponse;
