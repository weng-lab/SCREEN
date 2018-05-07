const global_data_global = require('./db/db_cache').global_data_global;

export default class TissueColors {
    static pad = (n) => ('00' + n).substr(-2);
    static rand = () => Math.floor(Math.random() * 256);
    static randColorGen = () => TissueColors.pad(TissueColors.rand().toString(16));
    static randColor = () => `#${TissueColors.randColorGen()}${TissueColors.randColorGen()}${TissueColors.randColorGen()}`;

    static async getTissueColor(t) {
        const tissueToColor = (await global_data_global()).colors['tissues'];
        if (!(t in tissueToColor)) {
            console.log('missing tissue color for', t);
            return TissueColors.randColor();
        }
        const c = tissueToColor[t];
        if (!c.startsWith('#')) {
            return '#' + c;
        }
        return c;
    }
}
