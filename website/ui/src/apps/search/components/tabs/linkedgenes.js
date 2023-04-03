import React, { useMemo } from "react"
import { ApolloClient, gql, InMemoryCache, useQuery } from "@apollo/client"
import { LoadingMessage, ErrorMessage } from "../../../../common/utility"

import { tabEles } from "../../config/details"
import { LinkedGenesTable } from "../../config/details_tables"

/**
 * GQL API linkgenes query for the linkged 
 */
const LINKED_GENES = gql`
  query (
    $assembly: String!
    $accession: [String!]
  ) {
    linkedGenesQuery(
      assembly:  $assembly
      accession: $accession
    ) {
      assembly
      accession
      experiment_accession
      celltype
      gene
      assay
    }
  }
`

/**
 * GQL API gene query
 */
const GENE_QUERY = gql`
  query (
    $assembly: String!
    $id: [String!]
  ) {
    gene(
      assembly: $assembly
      id: $id
    ) {
      name
      id
    }
  }
  `

// returns geneids from linked genes query
const geneIDs = (linkedGenes) => {
  let geneIDs = []
  for (let i in linkedGenes){
    geneIDs.push(linkedGenes[i].gene)
  }
  return geneIDs
}

/**
 * Constructs the table for Linked Genes tab and renders the table
 */
class LinkedGenesView extends React.Component {
  constructor(props) {
    super(props)
    this.linked = [] // list of objects to render
    this.ids = {} // map gene ids to names

    for (let x of props.linkedgeneIDs)
      this.ids[x.id] = x.name
    
    for (let x of props.linkedgenes){
      this.linked.push({
        gene: this.ids[x.gene],
        celltype: x.celltype,
        method: x.assay
      })
    }
  }

  render() {
    return tabEles(this.props.globals, {linked_genes: this.linked}, LinkedGenesTable(this.props.globals, this.props.assembly), 1)
  }
}
  
/**
 * Uses linkedgenesQuery and gene query to construct the Linked Genes tab
 * @param {props}
 * @returns LinkedGenesView - rendered linked lenes tab
 */
const LinkedGenesTab = (props) => {
  const client = useMemo(
    () =>
      new ApolloClient({
        uri: "https://ga.staging.wenglab.org/graphql",
        cache: new InMemoryCache(),
      }),
    [ props.cre_accession_detail ]
  )

  const { loading: loading_linked, error: error_linked, data: data_linked } = useQuery(LINKED_GENES,
    {
      variables: {
        assembly: props.assembly,
        accession: [ props.cre_accession_detail ]
      },
      fetchPolicy: 'cache-and-network',
      nextFetchPolicy: 'cache-first',       
      client 
    }
  )
  
  const { loading: loading_genes, error: error_genes, data: data_genes } = useQuery(GENE_QUERY,
    {
      variables: {
        assembly: props.assembly,
        id: geneIDs(data_linked?.linkedGenesQuery)
      },
      fetchPolicy: 'cache-and-network',
      nextFetchPolicy: 'cache-first', 
      client 
    }
  )

  return (
    loading_linked || loading_genes ? LoadingMessage() : 
    error_linked ? ErrorMessage(error_linked) : 
    !loading_linked && error_genes ? ErrorMessage(error_genes) :
    (
      <div>
        <LinkedGenesView linkedgenes={data_linked.linkedGenesQuery} linkedgeneIDs={data_genes.gene}/>
      </div>
    )
  )
}

export default LinkedGenesTab