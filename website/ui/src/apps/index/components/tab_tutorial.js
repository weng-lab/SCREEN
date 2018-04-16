import React from 'react'

import {Tabs, Tab} from 'react-bootstrap'
import {tabPanelize} from '../../../common/utility'
import ASHG from './tab_ashg_2017'

class UTabTutorial extends React.Component {
    constructor(props) {
	super(props);
        this.key = "tutorial"
    }

    shouldComponentUpdate(nextProps, nextState) {
        return this.key === nextProps.maintabs_active;
    }

    render() {
        if(this.key !== this.props.maintabs_active){
	    return false;
	}
	const Iframe = (url) => (
            <iframe width="560" height="315"
	            src={url}
		    title={url}
	            frameBorder="0" allowFullScreen>
	    </iframe>);
	    
	return (tabPanelize(
            <div>
                <h2>Tutorials</h2>
                <h3>Main Search</h3>
                {Iframe("https://www.youtube.com/embed/gOS7Eyi0xvM")}

	        <h3>Search Results Table</h3>
		{Iframe("https://www.youtube.com/embed/tOUJJ1L1E20")}

		<h3>ccRE Details</h3>
                {Iframe("https://www.youtube.com/embed/58U6k86vz2U")}

                <h3>Gene Expression</h3>
		{Iframe("https://www.youtube.com/embed/D6dxzSX2XTE")}
		
	        <h3>Differential Gene Expression</h3>
		{Iframe("https://www.youtube.com/embed/KzsuZ8oGxZk")}

	        <h3>GWAS</h3>
		{Iframe("https://www.youtube.com/embed/eunBo1-yF9M")}

	        <h3>Mini-Peaks (ccRE signal profile)</h3>
		{Iframe("https://www.youtube.com/embed/IMHOTf-rG1Q")}
		
	    </div>));
    }
}

class TabTutorial extends React.Component {

    constructor(props) {
	super(props);
	this.key = "tutorial";
    }

    render() {
	return (
		<Tabs defaultActiveKey={1} id="tabset">
		  <Tab eventKey={1} title="Videos">
		    <UTabTutorial {...this.props} />
                  </Tab>
	          <Tab eventKey={2} title="ASHG 2017">
		    <ASHG {...this.props} />
		  </Tab>
		</Tabs>
	);
    }
    
}
export default TabTutorial;
