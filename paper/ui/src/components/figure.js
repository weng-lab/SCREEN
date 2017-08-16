let React = require('react');

export const Figure = ({ number, url, description, title }) => (
    <div className="row">
        <div className="col-md-12">
            <div className={"panel panel-default"}>
                <div className="panel-body">
                    <figure className={"figure"}>
	                <object data={url} type="image/svg+xml" style={{width: "100%"}} />
                        <figcaption className={"figure-caption"}>
                            <b>{title}</b>. {description}
                        </figcaption>
                    </figure>
                </div>
            </div>
        </div>
    </div>
);
export default Figure;
