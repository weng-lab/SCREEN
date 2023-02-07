/*
 * SPDX-License-Identifier: MIT
 * Copyright (c) 2016-2020 Michael Purcaro, Henry Pratt, Jill Moore, Zhiping Weng
 */

import React, { useMemo } from "react"

import { Message } from "semantic-ui-react"
import { Tabs, Tab } from "react-bootstrap"
import { tabPanelize } from "../../../common/utility"

import loading from "../../../common/components/loading"
import Ztable from "../../../common/components/ztable/ztable"

import { ApolloClient, gql, InMemoryCache, useQuery } from "@apollo/client"

/**
 * This file and function queries for versions tab data and returns the rendered display
 * @returns versions tab
 */
const TabDataScreen = () => {
  const client = useMemo(
    () =>
      new ApolloClient({
        uri: "https://ga.staging.wenglab.org/graphql",
        cache: new InMemoryCache(),
      }),
    []
  )

  const { loading, error, data } = useQuery(
    gql`
      query {
        groundLevelVersionsQuery {
          version
          biosample
          assay
          accession
        }
      }
    `,
    { client }
  )

  return loading ? (
    LoadingMessage()
  ) : error ? (
    ErrorMessage(error)
  ) : (
    <div>
      <VersionView data={data} />
    </div>
  )
}

/**
 * links experiment accessions to their encode url and renders the columns
 * @returns columns for Ztable
 */
const CtsTableColumns = () => {
  const renderBiosample = (biosample) => biosample
  const renderExperiments = (experiments) => experiments
  return [
    {
      title: "Biosample",
      data: "biosample_term_name",
      render: renderBiosample,
    },
    {
      title: "Experiments",
      data: "experiments",
      render: renderExperiments,
    },
  ]
}

/**
 * creates a url from experiment accession and maps them
 * @param {Map} experiments dict of experiments {assay : [ experiments ]}
 * @returns map of assays to a list of encode experiment urls
 */
const dccLinks = (experiments) => {
  const dccLink = (assay, accs) => {
    const url = (acc) => "https://www.encodeproject.org/experiments/" + acc
    return (
      <p key={assay}>
        <strong>{assay}</strong>:&nbsp;
        {accs.map((acc, i) => (
          <span key={acc}>
            <a href={url(acc)} target="_blank" rel="noopener noreferrer">
              {acc}
            </a>
            {i < accs.length - 1 && ", "}
          </span>
        ))}
      </p>
    )
  }
  return Object.keys(experiments).map((assay) => dccLink(assay, experiments[assay]))
}

/**
 * Logs and returns loading message
 * @returns active loader
 */
const LoadingMessage = () => {
  console.log("Loading...")
  return loading({ isFetching: true, isError: false })
}

/**
 * Logs and returns error message
 * @param {ApolloError} error
 * @returns error message
 */
const ErrorMessage = (error) => {
  console.log("Error!")
  console.log(error.message)
  return (
    <Message negative>
      <Message.Header>Error!</Message.Header>
      <p>There was an error loading this page, try reloading.</p>
    </Message>
  )
}

/**
 * Organize and render data from query
 * @param {any} data groundLevelVersionsQuery
 * @returns rendered display of versions tab
 */
class VersionView extends React.Component {
  constructor(props) {
    super(props) // check this?
    this.collection = {} // version collection { version: { biosample: { assay: [ experiments ] } } }
    this.totals = {} // total experiments for each version { version: number of experiments }
    this.versions = {} // dict of versions to biosample objects { version: [ { biosample: { assay: [ experiments ] } ] }
    this.versionIDs = [] // IDs of each version

    // construct collection from query
    for (let x of this.props.data.groundLevelVersionsQuery) {
      if (this.collection[x.version] === undefined) {
        this.versionIDs.push(x.version)
        this.versions[x.version] = []
        this.collection[x.version] = { [x.biosample]: { [x.assay]: [x.accession] } }
      } else if (this.collection[x.version][x.biosample] === undefined)
        this.collection[x.version][x.biosample] = { [x.assay]: [x.accession] }
      else if (this.collection[x.version][x.biosample][x.assay] === undefined)
        this.collection[x.version][x.biosample][x.assay] = [x.accession]
      else this.collection[x.version][x.biosample][x.assay].push(x.accession)

      // count experiments
      if (this.totals[x.version] === undefined) this.totals[x.version] = 1
      else this.totals[x.version] += 1
    }

    // link experiments to their encode url and make a list of objects for Ztable
    Object.keys(this.collection).forEach((version) => {
      Object.keys(this.collection[version]).forEach((biosample) => {
        this.versions[version].push({
          biosample_term_name: biosample
            .substring(0, biosample[biosample.length - 1] === "'" ? biosample.length - 1 : biosample.length)
            .replace(/b'/g, "")
            .replace(/b"/g, ""),
          experiments: dccLinks(this.collection[version][biosample]),
        })
      })
    })
  }

  render() {
    return (
      <div>
        <Tabs defaultActiveKey={1} id="tabset">
          {this.versionIDs.map((id, i) => (
            <Tab title={id} key={id} eventKey={i}>
              <h3>
                ENCODE and Roadmap Experiments constituting ground level version {id} ({this.totals[id].toLocaleString()} total)
              </h3>
              <Ztable data={this.versions[id]} cols={CtsTableColumns()} />
            </Tab>
          ))}
        </Tabs>
      </div>
    )
  }
}

class TabVersions extends React.Component {
  key = "versions"

  shouldComponentUpdate(nextProps, nextState) {
    return this.key === nextProps.maintabs_active
  }

  render() {
    if (this.key !== this.props.maintabs_active) return false
    return tabPanelize(
      <div>
        <TabDataScreen />
      </div>
    )
  }
}

export default TabVersions
