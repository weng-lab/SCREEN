/*
 * SPDX-License-Identifier: MIT
 * Copyright (c) 2016-2020 Michael Purcaro, Henry Pratt, Jill Moore, Zhiping Weng
 */

import TabMain from '../components/tab_main';
import TabAbout from '../components/tab_about';
import TabTutorial, { TabUCSC } from '../components/tab_tutorial';
import TabQuery from '../components/tab_query';
import TabVersions from '../components/tab_versions';

import TabFiles from '../components/tab_files';
import React from 'react';
import {tabPanelize} from '../../../common/utility'
/*
import TabAPI from '../components/tab_api';
*/

const TabCCREVersions = () => tabPanelize(
    <React.Fragment>
        <h2>Versions of the ENCODE Registry of cCREs</h2>
        <p style={{ textIndent: "50px", fontSize: "1.2em" }}>Three versions of the Registry of candidate cis-regulatory elements (cCREs) have been produced to date by the ENCODE consortium, with a fourth currently being built for release in 2022. Although many cCREs are preserved between versions, later versions have additional cCREs and cell type annotations not present in earlier versions, and the coordinates of some cCREs may differ slightly between versions, in which case they are assigned distinct accession numbers. We recommend use of the latest version (V3) for new projects. Statistics and URLs for the versions are provided below. <strong><u>If you use cCREs in your work, be sure to mention their accessions, the version of the Registry you are using, along with the citation</u></strong>:</p>
        <p style={{ marginLeft: "50px", fontSize: "1.2em" }}>ENCODE Project Consortium, Jill E. Moore, Michael J. Purcaro, Henry E. Pratt, Charles B. Epstein, Noam Shoresh, Jessika Adrian, et al. 2020. “Expanded Encyclopaedias of DNA Elements in the Human and Mouse Genomes.” <em>Nature</em> 583 (7818): 699–710.</p>
        <br />
        <h4><u>Registry V3</u> (Latest Version)</h4>
        <strong>Release date</strong>: 2021<br />
        <strong>URL</strong>: <a href="https://screen.encodeproject.org/">screen.encodeproject.org</a><br />
        <strong>Human Genome assembly</strong>: hg38<br />
        <strong>Human cCRE count</strong>: 1,063,878<br />
        <strong>Human cell and tissue types covered</strong>: 1,518<br />
        <strong>Mouse Genome assembly</strong>: mm10<br />
        <strong>Mouse cCRE count</strong>: 313,838<br />
        <strong>Mouse cell and tissue types covered</strong>: 169<br /><br />
        <h4><u>Registry V2</u> (Version used in above-cited <em>Nature</em> paper)</h4>
        <strong>Release date</strong>: 2019<br />
        <strong>URL</strong>: <a href="https://screen-v2.wenglab.org/">screen-v2.wenglab.org</a><br />
        <strong>Human Genome assembly</strong>: hg38<br />
        <strong>Human cCRE count</strong>: 926,535<br />
        <strong>Human cell and tissue types covered</strong>: 839<br />
        <strong>Mouse Genome assembly</strong>: mm10<br />
        <strong>Mouse cCRE count</strong>: 339,815<br />
        <strong>Mouse cell and tissue types covered</strong>: 157<br /><br />
        <h4><u>Registry V1</u></h4>
        <strong>Release date</strong>: 2016<br />
        <strong>URL</strong>: <a href="https://screen-v10.wenglab.org/">screen-v1.wenglab.org</a><br />
        <strong>Human Genome assembly</strong>: hg19<br />
        <strong>Human cCRE count</strong>: 1,661,868<br />
        <strong>Human cell and tissue types covered</strong>: 622<br />
        <strong>Mouse Genome assembly</strong>: mm10<br />
        <strong>Mouse cCRE count</strong>: 628,352<br />
        <strong>Mouse cell and tissue types covered</strong>: 138<br />
    </React.Fragment>
);

const MainTabsConfig = () => {
    return {main : {title: "Overview", visible: true, f: TabMain},
            about : {title: "About", visible: true, f: TabAbout},
	    ucsc : {title: "UCSC Genome Browser", visible: true, f: TabUCSC},
            tutorial : {title: "Tutorials", visible: true, f: TabTutorial},
	    files: {title: "Downloads", visible: true, f: TabFiles},
        cversions: { title: "cCRE Versions", visible: false, f: TabCCREVersions },
	    versions: {title: "Versions", visible: true, f: TabVersions},
            query: {title: "Query Results", visible: false, f: TabQuery},
            /*api: {title: "API", visible: true, f: TabAPI}*/
    };
}

export default MainTabsConfig;
