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
        return (tabPanelize(
            <div>
                <h2>Tutorials</h2>
                <h3>Main Search</h3>
                <iframe width="560" height="315"
	                src="https://www.youtube.com/embed/gOS7Eyi0xvM"
	                frameborder="0" allowfullscreen>
		</iframe>

		<h3>cRE details</h3>
                <iframe width="560" height="315"
	                src="https://www.youtube.com/embed/58U6k86vz2U"
	                frameborder="0" allowfullscreen>
		</iframe>

                <h3>Gene Expression</h3>
		<iframe width="560" height="315"
	                src="https://www.youtube.com/embed/D6dxzSX2XTE"
	                frameborder="0" allowfullscreen>
		</iframe>

	        <h3>Differential Gene Expression</h3>
		<iframe width="560" height="315"
	                src="https://www.youtube.com/embed/KzsuZ8oGxZk"
	                frameborder="0" allowfullscreen>
		</iframe>

	        <h3>GWAS</h3>
		<iframe width="560" height="315"
	            src="https://www.youtube.com/embed/eunBo1-yF9M"
	            frameborder="0" allowfullscreen>
		</iframe>
		
	    </div>));
    }
}

export default TabTutorial;
