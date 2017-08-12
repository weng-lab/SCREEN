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
        return (tabPanelize(
            <div>
                <h2>Tutorials</h2>
                <h3>Main Search</h3>
                <iframe width="560" height="315"
	                src="https://www.youtube.com/embed/gOS7Eyi0xvM"
	                frameBorder="0" allowfullscreen>
		</iframe>

	        <h3>Search Results Table</h3>
		<iframe width="560" height="315"
	            src="https://www.youtube.com/embed/tOUJJ1L1E20"
	            frameBorder="0" allowfullscreen>
		</iframe>
	    
		<h3>cRE Details</h3>
                <iframe width="560" height="315"
	                src="https://www.youtube.com/embed/58U6k86vz2U"
	                frameBorder="0" allowfullscreen>
		</iframe>

                <h3>Gene Expression</h3>
		<iframe width="560" height="315"
	                src="https://www.youtube.com/embed/D6dxzSX2XTE"
	                frameBorder="0" allowfullscreen>
		</iframe>

	        <h3>Differential Gene Expression</h3>
		<iframe width="560" height="315"
	                src="https://www.youtube.com/embed/KzsuZ8oGxZk"
	                frameBorder="0" allowfullscreen>
		</iframe>

	        <h3>GWAS</h3>
		<iframe width="560" height="315"
	            src="https://www.youtube.com/embed/eunBo1-yF9M"
	            frameBorder="0" allowfullscreen>
		</iframe>
		
	    </div>));
    }
}

export default TabTutorial;
