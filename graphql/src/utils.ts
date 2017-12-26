export const isaccession = (s: String)  => {
    if (s.length != 12) {
        return false;
    }
    s = s.toLowerCase();
    // TODO: double check using regex
    return s.startsWith('eh37e') || s.startsWith('em10e') || s.startsWith('eh38e');
};

export const isclose = (a, b) => Math.abs(a - b) < Number.EPSILON;

export const natsort = (array) => {
    const collator = new Intl.Collator(undefined, {numeric: true, sensitivity: 'base'});
    return array.slice().sort(collator.compare);
};
