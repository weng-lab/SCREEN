import React, { Fragment, useState } from "react";
import { Grid, Tab, Table } from "semantic-ui-react";
import Async from "react-async";

import { Chart, Line } from "jubilant-carnival";

import Scatter from "./umap_scatter";
import { ccres_info } from "./umap_helpers";

import "./umap_plot.css";

const nmindpairs = [2, 3, 5, 10, 15, 20, 25, 30, 100]
  .map((n, ni) =>
    ["0.00", "0.01", "0.05", "0.10", "0.25", "0.50", "0.80", "0.99"].map(
      (mind, mindi) => [n, mind]
    )
  )
  .flat(1);

const IntersectingRegions = ({ accession }) => {
  return <Fragment></Fragment>;
};

const MouseHover = ({ i, x, y, p }) => {
  const style = { left: 0, top: 20 };
  const m = p.metadata;
  let zscore = "";
  if (p.metadata.isHigh > 1.64) {
    zscore = "high:" + p.metadata.isHigh;
  } else if (p.metadata.isHigh < -50) {
    zscore = "missing";
  } else {
    zscore = "low: " + p.metadata.isHigh;
  }

  return (
    <div className="toolTipTableBox" style={style}>
      <table className="toolTipTable">
        <tbody>
          <tr>
            <td>{"expID"}</td>
            <td>{m.expID}</td>
          </tr>
          <tr>
            <td>{"fileID"}</td>
            <td>{m.fileID}</td>
          </tr>
          <tr>
            <td>{"assay"}</td>
            <td>{m.assay}</td>
          </tr>
          <tr>
            <td>{"z-score"}</td>
            <td>{zscore}</td>
          </tr>
          <tr>
            <td>{"organ_slim"}</td>
            <td>{m.organ_slim}</td>
          </tr>
          <tr>
            <td>{"biosample summary"}</td>
            <td>{m.biosample_summary}</td>
          </tr>
          <tr>
            <td>{"color"}</td>
            <td style={{ backgroundColor: p.svgProps.fill }}>
              {"                                               "}
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  );
};

const AggregateTable = ({ data }) => {
  const cc = JSON.parse(data["cut_counts"]);

  let bins = new Float32Array(100);
  for (let r = 0; r < cc.length; r++) {
    for (let i = 0; i < 100; i++) {
      bins[i] += cc[r][i];
    }
  }

  const domain = {
    x: { start: 0.0, end: 100.0 },
    y: { start: 0.0, end: Math.max.apply(Math, bins) },
  };

  console.log(domain);

  let dd = new Array(100);
  for (let i = 0; i < 100; i++) {
    dd[i] = { x: i, y: bins[i] };
  }

  return (
    <div>
      <Chart
        innerSize={{ width: 600, height: 250 }}
        domain={domain}
        xAxisProps={{ fontSize: 10, title: "bins" }}
        yAxisProps={{ fontSize: 10, title: "cut counts" }}
      >
        <Line data={dd} strokeWidth={2.5} stroke="#888888" />
      </Chart>
    </div>
  );
};

const DoPlotUmap = ({ data }) => {
  const [selectedPoint, setSelectedPoint] = useState(null);
  const [hoverPointIdx, setHoverPointIdx] = useState(null);
  const [showLowZscore, setShowLowZscore] = useState(false);

  console.log(data);

  const { cut_counts, domain, points } = data;

  const ctcf = points[0]["metadata"]["ctcf"].toFixed(2);
  const dnase = points[0]["metadata"]["dnase"].toFixed(2);
  const h3k4me3 = points[0]["metadata"]["h3k4me3"].toFixed(2);
  const h3k27ac = points[0]["metadata"]["h3k27ac"].toFixed(2);

  const dc = dnase > 1.64 ? "dnaseHigh" : "";
  const ch = ctcf > 1.64 ? "ctcfHigh" : "";
  const h27c = h3k27ac > 1.64 ? "h3k27acHigh" : "";
  const hme3c = h3k4me3 > 1.64 ? "h3k4me3High" : "";

  return (
    <Grid>
      <Grid.Row>
        <Grid.Column width={4}>
          <Table celled textAlign={"center"}>
            <Table.Header>
              <Table.Row>
                <Table.HeaderCell>
                  max
                  <br />
                  DNase
                </Table.HeaderCell>
                <Table.HeaderCell>
                  max
                  <br />
                  H3K27ac
                </Table.HeaderCell>
                <Table.HeaderCell>
                  max
                  <br />
                  H3K4me3
                </Table.HeaderCell>
                <Table.HeaderCell>
                  max
                  <br />
                  CTCF
                </Table.HeaderCell>
              </Table.Row>
            </Table.Header>
            <Table.Body>
              <Table.Row>
                <Table.Cell className={dc}>{dnase}</Table.Cell>
                <Table.Cell className={h27c}>{h3k27ac}</Table.Cell>
                <Table.Cell className={hme3c}>{h3k4me3}</Table.Cell>
                <Table.Cell className={ch}>{ctcf}</Table.Cell>
              </Table.Row>
            </Table.Body>
          </Table>
        </Grid.Column>
        <Grid.Column width={12}>
          <AggregateTable {...{ data }} />
        </Grid.Column>
      </Grid.Row>
      <Grid.Row>
        <Grid.Column width={8}>
          <input
            name="showLowZScore"
            type="checkbox"
            checked={showLowZscore}
            onChange={() => setShowLowZscore(!showLowZscore)}
          />
          {"Show Low ZScore DNase"}
          <div style={{ position: "relative" }}>
            {hoverPointIdx && (
              <MouseHover
                i={hoverPointIdx[0]}
                x={hoverPointIdx[1]}
                y={hoverPointIdx[2]}
                p={points[hoverPointIdx[0]]}
              />
            )}
            <Scatter
              innerSize={{ width: 1100, height: 780 }}
              domain={domain}
              data={points}
              onPointClick={(i) =>
                selectedPoint === i
                  ? setSelectedPoint(null)
                  : setSelectedPoint(i)
              }
              onPointMouseOver={(i, e) =>
                setHoverPointIdx([i, e.pageX, e.pageY])
              }
              onPointMouseOut={() => setHoverPointIdx(null)}
              showLowZscore={showLowZscore}
              filterPoints={selectedPoint}
            />
          </div>
        </Grid.Column>
      </Grid.Row>
    </Grid>
  );
};

const UmapPlot = ({ cCRE, rDHS, nneighbors, min_dist, data }) => {
  const ccre_info = ccres_info[rDHS];
  console.log(data);

  return (
    <Tab.Pane style={{ height: "100vh" }}>
      <span>
        <h2>
          {rDHS +
            ": " +
            cCRE +
            ": n_neighbors: " +
            nneighbors +
            "; min_distance: " +
            min_dist +
            "; bins: 10bp"}
        </h2>
        <h3>
          {ccre_info["chr"]}
          {":"}
          {ccre_info["start"].toLocaleString()}
          {"-"}
          {ccre_info["end"].toLocaleString()}
        </h3>
        <Grid>
          <Grid.Row>
            <Grid.Column width={16}>
              <DoPlotUmap {...{ data }} />
            </Grid.Column>
          </Grid.Row>
        </Grid>
      </span>
    </Tab.Pane>
  );
};

export default UmapPlot;
