/*
 * SPDX-License-Identifier: MIT
 * Copyright (c) 2016-2020 Michael Purcaro, Henry Pratt, Jill Moore, Zhiping Weng
 */

let pills = (
  <ul className={"nav nav-pills nav-stacked col-md-3"}>
    {sortedKeys.map((tss) => {
      let d = data[tss]
      return (
        <li className={d["tab_active"]}>
          <a href={"#" + d["tss_sane"]} data-toggle={"pill"}>
            {tss}
          </a>
        </li>
      )
    })}
  </ul>
)

let content = (
  <div className={"tab-content col-md-9"}>
    {sortedKeys.map((tss) => {
      let d = data[tss]
      let title = (
        <div className={"container-fluid"} style={{ width: "100%" }}>
          <div className={"row"}>
            <div className={"col-md-3"}>
              <span>{d.tss}</span>
            </div>
            <div className={"col-md-3"}>
              <span>
                <em>{d.gene}</em>
              </span>
            </div>
            <div className={"col-md-3"}>
              <span>
                {d.chrom}:{d.start}-{d.stop}
              </span>
            </div>
          </div>
        </div>
      )
      return (
        <div className={"tab-pane " + d["tab_active"]} id={d["tss_sane"]}>
          {title}
          {React.createElement(HorizontalBars, { ...d, width: 800, barheight: "15" })}
        </div>
      )
    })}
  </div>
)
