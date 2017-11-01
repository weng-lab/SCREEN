import React from 'react';

import {connect} from 'react-redux';
import {bindActionCreators} from 'redux';
import { Button } from 'react-bootstrap';
import Dropzone from 'react-dropzone';

import * as Actions from '../actions/main_actions';
import * as ApiClient from '../../../common/api_client';

class BedUpload extends React.Component {
    constructor(props) {
	super(props);
	this.submitFiles = this.submitFiles.bind(this);
	this.state = { files: [] }
    }
    
    onDrop(files) {
	console.log("files:", files);
	this.setState({
	    files
	});
    }
    
    submitFiles(){
	let allLines = [];
	this.state.files.forEach(f => {
	    const reader = new FileReader();
            reader.onload = (r) => {
		const contents = r.target.result;
		const lines = contents.split('\n');
		lines.forEach((e) => {
		    allLines.push(e);
		});
            };
            reader.onabort = () => console.log('file reading was aborted');
            reader.onerror = () => console.log('file reading has failed');
	    reader.onloadend  = (e) => {
		const j = {uuid: this.props.uuid, 
			   assembly: this.props.assembly,
			   allLines};
		const jq = JSON.stringify(j);
		ApiClient.getIntersect(jq,
				       (r) => {
					   let j = {assembly: this.props.assembly, 
						    accessions: r.accessions,
						    uuid: r.uuid};
					   ApiClient.setByPost(JSON.stringify(j),
							       "/cart/set",
							       (response) => {
								   let href = window.location.href;
								   if(!href.includes("&cart")){
								       href += "&cart";
								   }
								   window.location.assign(href);				    
							       },
							       (msg) => {
								   console.log("error posting to cart/set", msg);
							       });
					   this.props.actions.setCart(r.accessions);
				       },
				       (msg) => {
					   console.log("error posting to cart/set", msg);
				       });
	    };
	    reader.readAsText(f);
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

		<Button onClick={this.submitFiles}>Intersect Files
		</Button>
	    </div>
	);
    }
}

const mapStateToProps = (state) => ({ ...state });
const mapDispatchToProps = (dispatch) => ({
    actions: bindActionCreators(Actions, dispatch)
});
export default connect(mapStateToProps, mapDispatchToProps)(BedUpload);
