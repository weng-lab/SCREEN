const GRAPHQL_UPSTREAM = "https://ga.staging.wenglab.org/graphql"
const createGraphqlProxy = require("./graphql-proxy")

module.exports = createGraphqlProxy({
  upstreamUrl: GRAPHQL_UPSTREAM,
  apiKeyEnv: "SCREEN_API_KEY",
  missingKeyMessage: "SCREEN_API_KEY is not configured",
  upstreamErrorMessage: "Unable to reach GraphQL upstream",
})
