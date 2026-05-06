const FACTORBOOK_GRAPHQL_UPSTREAM = "https://factorbook.api.wenglab.org/graphql"
const createGraphqlProxy = require("./graphql-proxy")

module.exports = createGraphqlProxy({
  upstreamUrl: FACTORBOOK_GRAPHQL_UPSTREAM,
  apiKeyEnv: "FACTORBOOK_API_KEY",
  missingKeyMessage: "FACTORBOOK_API_KEY is not configured",
  upstreamErrorMessage: "Unable to reach Factorbook GraphQL upstream",
})
