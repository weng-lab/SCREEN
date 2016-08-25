DROP MATERIALIZED VIEW IF EXISTS re_bed_intersection_{tablesuffix};

CREATE MATERIALIZED VIEW re_bed_intersection_{tablesuffix}
AS SELECT
   re.accession AS re_accession,
   bed_ranges_{tablesuffix}.file_accession AS file_accession,
   upper(bed_ranges_{tablesuffix}.startend * re.startend) - lower(bed_ranges_{tablesuffix}.startend * re.startend) AS overlap_bp,
   upper(bed_ranges_{tablesuffix}.startend * re.startend) - lower(bed_ranges_{tablesuffix}.startend * re.startend) / (upper(re.startend) - lower(re.startend)) AS overlap_pct
FROM
   re,
   bed_ranges_{tablesuffix}
WHERE
   upper(bed_ranges_{tablesuffix}.startend * re.startend) - lower(bed_ranges_{tablesuffix}.startend * re.startend) > 0
;
