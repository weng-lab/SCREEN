DROP MATERIALIZED VIEW IF EXISTS re_bed_intersection_{tablesuffix};

CREATE MATERIALIZED VIEW re_bed_intersection_{tablesuffix}
AS SELECT
   re_{resuffix}.accession AS re_accession,
   bed_ranges_{tablesuffix}.file_accession AS file_accession,
   upper(bed_ranges_{tablesuffix}.startend * re_{resuffix}.startend) - lower(bed_ranges_{tablesuffix}.startend * re_{resuffix}.startend) AS overlap_bp,
   upper(bed_ranges_{tablesuffix}.startend * re_{resuffix}.startend) - lower(bed_ranges_{tablesuffix}.startend * re_{resuffix}.startend) / (upper(re_{resuffix}.startend) - lower(re_{resuffix}.startend)) AS overlap_pct
FROM
   re_{resuffix},
   bed_ranges_{tablesuffix}
WHERE
   upper(bed_ranges_{tablesuffix}.startend * re_{resuffix}.startend) - lower(bed_ranges_{tablesuffix}.startend * re_{resuffix}.startend) > 0
;
