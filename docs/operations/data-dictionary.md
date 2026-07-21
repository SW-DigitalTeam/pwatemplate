# Data dictionary (calculated metrics)

| Metric | Definition | Source type |
|---|---|---|
| Registered | Enrolments with any status for the school-programme | Directly recorded |
| Active | Enrolment status = active | Directly recorded |
| Retained (week N) | Active at week N ÷ registered at week 1 | Calculated |
| Completed | Enrolment status = completed | Directly recorded |
| Attendance rate | Present + late ÷ (present+late+absent+left_early), superseded rows excluded | Calculated |
| Movement measure totals | Sum of `movement_entries.value` per measure_key — **never summed across keys** | Per `source` column |
| Survey completion rate | Submitted ÷ (submitted + in_progress + assigned-not-started) | Calculated |
| Baseline→endpoint change | Same pseudonym matched across versions of the same survey key | Calculated |
Every generated report carries: date generated, filters applied, environment,
and the source-type distinction (recorded / self-reported / observed /
calculated). A change is reported as *change*, not *impact*, unless an
evaluation design supports the stronger claim.
Small-group rule: demographic cells with n < 5 are suppressed.
