import {
    GraphQLObjectType,
    GraphQLList,
    GraphQLString
} from 'graphql';


export const CartResponse = new GraphQLObjectType({
    name: 'Cart',
    fields: () => ({
        accessions: {
            description: 'A list of accessions in the cart',
            type: new GraphQLList(GraphQLString)
        }
    })
});

export default CartResponse;
