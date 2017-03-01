import React from 'react'

import TabMain from './tab_main'
import TabAbout from './tab_about'
import TabTutorial from './tab_tutorial'
import {tabPanelize} from '../../../common/utility'

import loading from '../../../common/components/loading'

import * as Render from '../../../common/renders'

const MainTabConfig = () => {
    return {main : {title: "Overview", visible: true, f: TabMain},
            about : {title: "About", visible: true, f: TabAbout},
            tutorial : {title: "Tutorial", visible: true, f: TabTutorial}
    }
}

export default MainTabConfig;
