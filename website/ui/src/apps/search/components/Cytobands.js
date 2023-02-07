import React, { useMemo } from "react"
import { gql, useQuery } from "@apollo/client"
import { Cytobands } from "umms-gb"
import { Grid } from "semantic-ui-react"

const CYTOBAND_QUERY = gql`
  query cytobands($assembly: String!, $chromosome: String) {
    cytoband(assembly: $assembly, chromosome: $chromosome) {
      stain
      coordinates {
        chromosome
        start
        end
      }
    }
  }
`

const CytobandView = (props) => {
  const { loading, data } = useQuery(CYTOBAND_QUERY, {
    variables: {
      assembly: props.assembly === "GRCh38" ? "hg38" : props.assembly,
      chromosome: props.chromosome,
    },
  })
  const domain = useMemo(
    () =>
      data && {
        start: 0,
        end: Math.max(...(data.cytoband.length === 0 ? [1] : data.cytoband.map((x) => x.coordinates.end))),
      },
    [data]
  )
  return loading || !data ? null : (
    <Grid style={{ width: "100%" }}>
      <Grid.Column width={2} />
      <Grid.Column width={12}>
        <svg width="100%" viewBox={`0 0 ${props.innerWidth} ${props.height}`}>
          <Cytobands
            highlight={props.position && { ...props.position, color: "#0000ff" }}
            data={data.cytoband}
            domain={domain}
            width={props.innerWidth}
            height={props.height}
            id="cytobands"
          />
        </svg>
      </Grid.Column>
      <Grid.Column width={2}>
        <strong>
          {props.assembly}:{props.chromosome}
        </strong>
      </Grid.Column>
    </Grid>
  )
}
export default CytobandView
