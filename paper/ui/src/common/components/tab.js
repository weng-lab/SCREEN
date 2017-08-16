let React = require('react');

const Tab = ({ children }) => (
    <div>
        <div className={"panel panel-default"}>
            <div className={"panel-body"}>
                <div className={"container-fluid"}>
                    {children}
	        </div>
	    </div>
	</div>
    </div>
);
export default Tab;
