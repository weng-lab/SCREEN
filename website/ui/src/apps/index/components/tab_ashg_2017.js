/*
 * SPDX-License-Identifier: MIT
 * Copyright (c) 2016-2020 Michael Purcaro, Henry Pratt, Jill Moore, Zhiping Weng
 */

import React from "react"

import { tabPanelize } from "../../../common/utility"

class TabAshg2017 extends React.Component {
  constructor(props) {
    super(props)
    this.key = "ashg2017"
  }

  shouldComponentUpdate(nextProps, nextState) {
    return this.key === nextProps.maintabs_active
  }

  render() {
    return tabPanelize(
      <div>
        <h2>ASHG 2017</h2>
        <ul>
          <li>
            <a href={"https://www.dropbox.com/s/sdydrxklb6ff3b7/ASHG-Workshop-2017.pptx?dl=0"} target={"_blank"}>
              <h4>{"Workshop Slides"}</h4>
            </a>
          </li>

          <li>
            <a href={"https://www.dropbox.com/s/mo0jkli3a2cj19d/ASHG-Workshop-2017-Handout.docx?dl=0"} target={"_blank"}>
              <h4>{"Handout: Navigating the ENCODE Encyclopedia"}</h4>
            </a>
          </li>

          <li>
            <a href={"https://groups.google.com/forum/#!forum/encode-encyclopedia"} target={"_blank"}>
              <h4>{"ENCODE Encyclopedia mailing list"}</h4>
            </a>
          </li>
        </ul>
      </div>
    )
  }
}

export default TabAshg2017
