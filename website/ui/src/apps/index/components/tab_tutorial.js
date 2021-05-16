import React from "react";

import { tabPanelize } from "../../../common/utility";

class TabTutorial extends React.Component {
  render() {
    const Iframe = (url) => (
      <iframe
        width="560"
        height="315"
        src={url}
        title={url}
        frameBorder="0"
        allowFullScreen
      ></iframe>
    );

    return tabPanelize(
      <div>
        <h2>Tutorials</h2>

        <h3>Main Search</h3>
        {Iframe("https://www.youtube.com/embed/U-NvLkNx-N4")}

        <h3>Search Results Table</h3>
        {Iframe("https://www.youtube.com/embed/ZjxoZngwsxI")}

        <h3>cCRE Details</h3>
        {Iframe("https://www.youtube.com/embed/lHJ9T1H676M")}

        <h3>Mini-Peaks (cCRE signal profile)</h3>
        {Iframe("https://www.youtube.com/embed/btBh6x-mh1Q")}

        <h3>Gene Expression</h3>
        {Iframe("https://www.youtube.com/embed/s-vsuzA8PJs")}

        <h3>Differential Gene Expression</h3>
        {Iframe("https://www.youtube.com/embed/KzsuZ8oGxZk")}

        <h3>GWAS</h3>
        {Iframe("https://www.youtube.com/embed/3mZ2IAuCobg")}
      </div>
    );
  }
}

export default TabTutorial;
