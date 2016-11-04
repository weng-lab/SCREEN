import React, {PropTypes} from 'react'
import SliderFacet from '../../../common/components/slider'
import {wrap_facet} from '../helpers/create_facet'

const MainSliderFacet = ({visible, title, range, value, onChange}) => {
    return wrap_facet(visible,
		      <SliderFacet onChange={onChange} value={value} range={range} title={title} />);
};

MainSliderFacet.propTypes = {
    visible: PropTypes.bool.isRequired,
    onChange: PropTypes.func.isRequired,
    title: PropTypes.string.isRequired,
    range: PropTypes.any.isRequired,
    value: PropTypes.any.isRequired
};

export default MainSliderFacet;
