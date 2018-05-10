import { GraphQLError } from 'graphql/error/GraphQLError';
import { Kind } from 'graphql/language';
import { GraphQLScalarType } from 'graphql';

const validate = require('uuid-validate');

const parse = value => {
    if (!validate(value)) {
        throw new GraphQLError('Not a UUID: ' + value);
    }
    return value;
};
export const UUID = new GraphQLScalarType({
    name: 'UUID',
    description: 'RFC4122 version 4 UUID',
    serialize(value) {
        return value;
    },
    parseValue(value) {
        return parse(value);
    },
    parseLiteral(ast) {
        if (ast.kind !== Kind.STRING) {
            throw new GraphQLError('Not a string: ' + ast);
        }
        return parse(ast.value);
    },
});
