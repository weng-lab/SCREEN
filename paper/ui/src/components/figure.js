let React = require('react');

export const Figure = ({ number, url, description, title, style = {} }) => (
    <div className="row">
        <div className="col-md-12">
            <div className={"panel panel-default"}>
                <div className="panel-body">
                    <figure className={"figure"}>
	                <img src={url} alt={title} style={style}
                          className={"figure-img img-fluid rounded img-responsive"} />
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
