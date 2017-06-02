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
	                src="https://www.youtube.com/embed/_bQtmsPeMKA"
	                frameborder="0" allowfullscreen>
		</iframe>

                <h3>Gene Expression</h3>
		<iframe width="560" height="315"
	                src="https://www.youtube.com/embed/2cJUiu8Cg_Y"
	                frameborder="0" allowfullscreen>
		</iframe>

	        <h3>Differential Gene Expression</h3>
		<iframe width="560" height="315"
	                src="https://www.youtube.com/embed/1bI9tiJimag"
	                frameborder="0" allowfullscreen>
		</iframe>
	    </div>));
    }
}

export default TabTutorial;
