var React = require('react');
var $ = require('jquery');

import {create_venn_diagram} from '../helpers/venn'

class VennDiagram extends React.Component {

    constructor(props) {
	super(props);
    }

    componentDidUpdate() {
	$(this.refs.container).empty();
	create_venn_diagram(this.refs.container, this.props.sets, this.props.overlaps);
    }
    
    render() {
	return <div ref="container" style={{width: this.props.width, height: this.props.height}} />;
    }
    
}
export default VennDiagram;
