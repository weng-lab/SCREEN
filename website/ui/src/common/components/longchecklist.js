/*
 * SPDX-License-Identifier: MIT
 * Copyright (c) 2016-2020 Michael Purcaro, Henry Pratt, Jill Moore, Zhiping Weng
 */

import React from "react";

import Ztable from "./ztable/ztable";

import { CHECKLIST_MATCH_ALL, CHECKLIST_MATCH_ANY } from "./checklist";

class LongChecklist extends React.Component {
  constructor(props) {
    super(props);
    this._td_handler = this._td_handler.bind(this);
    this._render_checkbox = this._render_checkbox.bind(this);
    this.modeToggle = this.modeToggle.bind(this);
  }

  _render_checkbox(selected) {
    return <input type="checkbox" checked={selected} onChange={() => {}} />; // onTdClick will still fire
  }

  _td_handler(r, k) {
    if (this.props.onTdClick) {
      this.props.onTdClick(k.key, r);
    }
  }

  modeToggle() {
    var n_value =
      this.props.mode === CHECKLIST_MATCH_ANY
        ? CHECKLIST_MATCH_ALL
        : CHECKLIST_MATCH_ANY;
    if (this.props.onModeChange) {
      this.props.onModeChange(n_value);
    }
  }

  render() {
    var mode = this.props.mode ? this.props.mode : CHECKLIST_MATCH_ALL;

    var checks = "";
    if (this.props.match_mode_enabled) {
      checks = (
        <div>
          <input
            type="radio"
            defaultChecked={mode === CHECKLIST_MATCH_ALL ? true : false}
            onClick={this.modeToggle}
          />
          match all&nbsp;
          <input
            type="radio"
            defaultChecked={mode === CHECKLIST_MATCH_ANY ? true : false}
            onClick={this.modeToggle}
          />
          match any
        </div>
      );
    }

    var cols = [
      {
        title: "",
        data: "selected",
        render: this._render_checkbox,
        orderable: false,
        className: this.props.checkBoxClassName,
      },
      ...this.props.cols,
    ];

    var paging = this.props.data.length < 10 ? false : true;

    return (
      <div>
        {checks}
        <Ztable
          cols={cols}
          data={this.props.data}
          order={this.props.order}
          sortCol={this.props.sortCol}
          buttonsOff={this.props.buttonsOff}
          onTdClick={this._td_handler}
          bFilter={true}
          bLengthChange={false}
          paging={paging}
          noSearchBox={this.props.noSearchBox}
          noTotal={this.props.noTotal}
        />
      </div>
    );
  }
}

export default LongChecklist;
