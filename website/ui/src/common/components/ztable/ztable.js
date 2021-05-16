/*
 * SPDX-License-Identifier: MIT
 * Copyright (c) 2016-2020 Michael Purcaro, Henry Pratt, Jill Moore, Zhiping Weng
 */

import React from "react";
import os from "os";
import {
  Form,
  FormGroup,
  FormControl,
  Pagination,
  FormText,
} from "react-bootstrap";
import SortOrder from "./sort_order";
import SortCols from "./sort_cols";
import DataSource from "./datasource";

const CSVLink = ({ rawData, separator, filename, children }) => {
  if (!rawData) {
    return null;
  }
  let data = rawData.map((x) => x.join("\t")).join(os.EOL);
  return (
    <a
      download={filename + ".tsv"}
      href={"data:text/tsv;charset=utf-8," + encodeURIComponent(data)}
    >
      {children}
    </a>
  );
};

const filterVisibleCols = (cols) =>
  cols.filter((c) => {
    if ("visible" in c) {
      return c["visible"];
    }
    return true;
  });

const klassName = (colInfo) => {
  let k = "";
  if ("className" in colInfo) {
    k = colInfo.className;
  }
  return k;
};

class Footer extends React.Component {
  render() {
    if (this.props.noTotal) {
      return false;
    }

    return this.props.ds.rowIDs.length ? (
      <FormText>Total: {this.props.ds.rowIDs.length}</FormText>
    ) : (
      <FormText>{this.props.emptyText}</FormText>
    );
  }
}

class SearchBox extends React.Component {
  render() {
    if (this.props.noSearchBox) {
      return false;
    }

    return (
      <div style={{ float: "right" }}>
        <Form inline>
          <FormGroup>
            Search:
            <FormControl
              bsSize="small"
              size="15"
              type="text"
              value={this.props.value}
              onKeyPress={(event) => {
                if (event.which === 13 /* Enter */) {
                  // prevent form submission, from
                  // https://github.com/christianalfoni/formsy-react/issues/360
                  return event.preventDefault();
                }
                return null;
              }}
              onChange={this.props.onChange}
            />
            <FormControl.Feedback />
          </FormGroup>
        </Form>
      </div>
    );
  }
}

class PageBox extends React.Component {
  render() {
    return (
      <Pagination
        className="users-pagination pull-right"
        bsSize="small"
        maxButtons={3}
        first
        last
        next
        prev
        boundaryLinks
        items={this.props.pages}
        activePage={this.props.curPage}
        onSelect={this.props.onSelect}
      />
    );
  }
}

class Zheader extends React.Component {
  render() {
    return (
      <tr>
        {this.props.colInfos.map((colInfo, idx) => {
          let k = "text-center " + klassName(colInfo);
          let { sk, so } = this.props.sortCols.getHeaderKlass(colInfo);
          k += " " + sk;
          return (
            <th
              className={k}
              key={idx}
              onClick={this.props.onClick(colInfo, so)}
            >
              {colInfo.title}
            </th>
          );
        })}
      </tr>
    );
  }
}

class Zrow extends React.Component {
  render() {
    return (
      <tr>
        {this.props.rowData.map((r, idx) => {
          const k = "text-center " + r[1];
          return (
            <td
              className={k}
              key={this.props.dataIdx.toString() + "_" + idx.toString()}
              onClick={this.props.onRowClick(k, this.props.dataIdx)}
            >
              {r[0]}
            </td>
          );
        })}
      </tr>
    );
  }
}

class Ztable extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      search: "",
      pageNum: 1, // page indexes are 1-based
      pageSize: 10,
      sortCols: new SortCols(props.sortCol),
    };
  }

  render() {
    const searchBoxChange = (e) => {
      this.setState({ search: e.target.value, pageNum: 1 });
    };

    const pageClick = (e) => {
      this.setState({ pageNum: e });
    };

    const sortClick = (colInfo, curOrder) => () => {
      if (SortOrder.DISABLED === curOrder) {
        return;
      }
      const m = this.state.sortCols.colClick(colInfo, curOrder);
      this.setState({ sortCols: m });
    };

    const rowClick = (klasses, dataIdx) => (e) => {
      if (this.props.onTdClick) {
        this.props.onTdClick(klasses, this.props.data[dataIdx]);
      }
    };

    let ds = new DataSource(this.props.data, this.props.cols);
    ds.filterAndSort(this.state);

    let tableKlass = "table table-bordered-bottom table-condensed table-hover";
    let visibleCols = filterVisibleCols(this.props.cols);

    let rowData = this.props.data.map((row, i) =>
      visibleCols.map((colInfo) => {
        let k = klassName(colInfo);
        if ("defaultContent" in colInfo) {
          return [colInfo.defaultContent, k];
        }
        let rd = row[colInfo.data];
        if ("render" in colInfo) {
          try {
            const rend = colInfo.render(rd);
            return [rend, k];
          } catch (err) {
            console.log("Zrow: error when rendering: row col data was:", rd);
            console.log("Zrow: error when rendering: row data was:", row);
            console.log("Zrow: error when rendering: row klass was:", k);
            console.log("Zrow: error when rendering: colInfo was:", colInfo);
            throw err;
          }
        }
        return [rd, k];
      })
    );

    let visiblenonempty = visibleCols.filter((colInfo) => colInfo.title !== "");
    let hasobj = false;
    let rawData = this.props.data.map((row, i) =>
      visiblenonempty.map((colInfo) => {
        let ret = "";
        if ("render" in colInfo) {
          let app = colInfo.render(row[colInfo.data]);
          if (app && typeof app === "object") {
            return (hasobj = true); // return assignment to avoid warning
          }
          ret += app;
        } else {
          ret += row[colInfo.data] || "";
        }
        return ret.replace(/,/g, ";");
      })
    );
    return (
      <div style={{ width: "100%" }}>
        <SearchBox
          value={this.state.search}
          onChange={searchBoxChange}
          noSearchBox={this.props.noSearchBox}
        />
        {hasobj ? (
          <span />
        ) : (
          <CSVLink
            rawData={rawData}
            filename="screen-tsv-download"
            separator={"\t"}
          >
            TSV
          </CSVLink>
        )}
        <table className={tableKlass}>
          <thead>
            <Zheader
              colInfos={visibleCols}
              sortCols={this.state.sortCols}
              onClick={sortClick}
            />
          </thead>
          <tbody>
            {ds.rowIDs.slice(ds.rowStart, ds.rowEnd).map((idx) => (
              <Zrow
                rowData={rowData[idx]}
                key={idx}
                dataIdx={idx}
                onRowClick={rowClick}
                colInfos={visibleCols}
              />
            ))}
          </tbody>
        </table>
        {ds.numPages > 1 && (
          <PageBox
            pages={ds.numPages}
            curPage={this.state.pageNum}
            onSelect={pageClick}
          />
        )}
        <Footer
          ds={ds}
          noTotal={this.props.noTotal}
          emptyText={this.props.emptyText}
        />
      </div>
    );
  }
}

export default Ztable;
