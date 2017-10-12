import React from 'react';

import {connect} from 'react-redux';
import {bindActionCreators} from 'redux';

import Dropzone from 'react-dropzone';

import HelpIcon from '../../../common/components/help_icon';

import * as Render from '../../../common/zrenders';
import * as Actions from '../actions/main_actions';

class BedUpload extends React.Component {
    constructor(props) {
	super(props);
	this.state = { files: [] }
    }
    
    onDrop(files) {
	this.setState({
	    files
	});
    }
    
    render() {
	return (
	    <div>
		<h2>cRE intersection</h2>
		Upload bed files here to be automatically intersected with all available cREs.
		<br />
		<div className="dropzone">
		    <Dropzone onDrop={this.onDrop.bind(this)}>
			<p>Drop bed files here, or click to select bed files to upload.</p>
		    </Dropzone>
		</div>
		<aside>
		    <h2>Beds</h2>
		    <ul>
			{
			    this.state.files.map(f =>
				<li key={f.name}>{f.name} - {f.size} bytes</li>)
			}
		    </ul>
		</aside>
	    </div>
	);
    }
}

const mapStateToProps = (state) => ({ ...state });
const mapDispatchToProps = (dispatch) => ({
    actions: bindActionCreators(Actions, dispatch)
});
export default connect(mapStateToProps, mapDispatchToProps)(BedUpload);
