module.exports = {
    globals: {
        'ts-jest': {
            tsConfig: 'tsconfig.json',
        },
    },
    testMatch: ['**/test/**/*.test.(ts|js)'],
    testEnvironment: 'node',
    preset: 'ts-jest'
}
