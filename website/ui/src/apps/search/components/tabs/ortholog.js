import React, { useMemo } from "react"
import { ApolloClient, gql, InMemoryCache, useQuery } from "@apollo/client"
import { LoadingMessage, ErrorMessage } from "../../../../common/utility"

import { tabEles } from "../../config/details"
import { OrthologTable } from "../../config/details_tables"

/**
 * REST API query for the ortholog tab
 */
const ORTHOLOG_QUERY = gql`
  query (
    $assembly: String!
    $accession: String!
  ) 
  {
    orthologQuery(accession:$accession,assembly:$assembly) {
      assembly
      accession
      ortholog {
        stop
        start
        chromosome
        accession
      }
    }
  }
`

/**
 * Constructs the table for ortholog tab and renders the table
 */
class OrthologView extends React.Component {
  constructor(props) {
    super(props)
    this.orthologs = [] // list of ortholog objects [{ accession, chrom, start, end }]

    for (let ccre of props.orthologQuery.ortholog){
      this.orthologs.push({
        accession: ccre.accession,
        chrom: ccre.chromosome,
        start: ccre.start,
        stop: ccre.stop
      })
    }
  }

  render () {
    return tabEles(this.props.globals, {ortholog: this.orthologs}, OrthologTable(this.props.globals, this.props.assembly, this.props.uuid), 1)
  }
}

/**
 * Uses orthologQuery and cCREQuery to construct the Linked cCREs in other assemblies tab
 * @param {props} 
 * @returns OrthologView - rendered ortholog tab
 */
const OrthologTab = (props) => {
  const client = useMemo(
    () =>
      new ApolloClient({
        uri: "https://factorbook.api.wenglab.org/graphql",
        cache: new InMemoryCache(),
      }),
    [ props.cre_accession_detail ]
  )
  
  const { loading, error, data } = useQuery(ORTHOLOG_QUERY,
    {
      variables: {
        assembly: (props.assembly === "GRCh38" ? "grch38" : "mm10"),
        accession: props.cre_accession_detail
      },
      fetchPolicy: 'cache-and-network',
      nextFetchPolicy: 'cache-first',
      client
    }
  )

  return (
    loading ? LoadingMessage() : 
    error ? ErrorMessage(error) :
    (
      <div>
        <OrthologView orthologQuery={data.orthologQuery}/>
      </div>
    )
  )
}

export default OrthologTab