var React = require('react')

import {ResultsDisplayCreator} from '../helpers/create_results_display'
import {results_displays} from '../config/results_displays'

class ResultsDisplayApp extends React.Component {

    constructor(props) {
	super(props);
    }

    render() {
	var store = this.props.store;
	var creator = ResultsDisplayCreator(store);
	return (<div style={{padding: "30px"}}>
		{Object.keys(results_displays).map((k) => {
		    var Retval = creator(k, results_displays[k]);
		    var footer = (typeof results_displays[k].footer === 'function'
				  ? results_displays[k].footer(store.dispatch)
				  : results_displays[k].footer);
		    return (<div style={{display: "inline-block"}} key={"div_" + k}>
			       <Retval key={k} store={store} />
			       {footer}
			    </div>);
		})}
		</div>);
    }

}
export default ResultsDisplayApp;
