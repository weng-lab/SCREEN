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
	return (<div>
		{Object.keys(results_displays).map((k) => {
		    var Retval = creator(k, results_displays[k]);
		    return <Retval key={k} store={store} />;
		})}
		</div>);
    }

}
export default ResultsDisplayApp;
