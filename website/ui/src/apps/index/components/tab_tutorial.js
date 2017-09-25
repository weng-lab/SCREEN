import React from 'react'

import {tabPanelize} from '../../../common/utility'

class TabTutorial extends React.Component {
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

		<h3>cRE Details</h3>
                {Iframe("https://www.youtube.com/embed/58U6k86vz2U")}

                <h3>Gene Expression</h3>
		{Iframe("https://www.youtube.com/embed/D6dxzSX2XTE")}
		
	        <h3>Differential Gene Expression</h3>
		{Iframe("https://www.youtube.com/embed/KzsuZ8oGxZk")}

	        <h3>GWAS</h3>
		{Iframe("https://www.youtube.com/embed/eunBo1-yF9M")}
		
	    </div>));
    }
}

export default TabTutorial;
