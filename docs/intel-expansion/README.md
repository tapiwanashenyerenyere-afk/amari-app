# Intelligence feed expansion notes

These notes resolve implementation details that differ from, or are implicit in,
the four specification files in this directory. The specification files remain
unchanged.

- `global` is a valid `news_sources.region` value and is the correct choice for
  sources that span multiple regions.
- Migration filenames use `YYYYMMDDNNNNNN_snake_case.sql`.
- `news_sources.default_weight` affects feed ranking today. It affects
  enrichment cost and queue priority only after the priority-enrichment work in
  PR B lands.
