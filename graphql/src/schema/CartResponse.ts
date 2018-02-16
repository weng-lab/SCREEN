import {
    GraphQLObjectType,
    GraphQLNonNull,
    GraphQLList,
    GraphQLString
} from 'graphql';


export const CartResponse = new GraphQLObjectType({
    name: 'Cart',
    fields: () => ({
        accessions: {
            description: 'A list of accessions in the cart',
            type: new GraphQLNonNull(new GraphQLList(new GraphQLNonNull(GraphQLString)))
        }
    })
});

export default CartResponse;
