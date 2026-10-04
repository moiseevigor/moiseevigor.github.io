# [Tech Blog](https://moiseevigor.github.io)

[![CircleCI](https://circleci.com/gh/moiseevigor/moiseevigor.github.io/tree/master.svg?style=svg)](https://circleci.com/gh/moiseevigor/moiseevigor.github.io/tree/master)

## Lab structure

Research programs are the unit (see `/lab/`, rendered by `lab.html`).

- `_data/series.yml` — single source of truth per program: question, status, outcome,
  verdict scoreboard, frontier, lineage (`grew_from`), code path, and the ordered parts
  and appendices. The Lab page, series TOC, prev/next nav and home cards render from it.
- `_posts/` — program parts. Part 1 is the program's only entry in the home feed;
  Parts 2+ carry `hidden: true` (dropped from pagination only; archives/tags/atom keep them).
- `_appendices/` — theory appendices (`series_part: A1`, `B3`, …; the letter is the program).
- `_articles/` — formal articles; link one to its program with `program: <series id>`.
- `research/<program>/` — code and data behind every number.

## Run Blog

Building image

```
docker build -t blog .
```

Serve blog from root dir

```
docker run --rm --volume="$PWD:/srv/jekyll" -p 4000:4000 -it blog jekyll serve --incremental
```

Open browser at https://localhost:4000/

## Run Blog with `_drafts`

Adding `--drafts` it will serve `*.markdown` files from `_drafts` folder.

```
docker run --rm --volume="$PWD:/srv/jekyll" -p 4000:4000 -it blog jekyll serve --drafts --incremental
```

## Testing

```
docker run --rm --volume="$PWD:/srv/jekyll" -it blog \
    bundle exec htmlproofer ./_site \
        --only-4xx \
        --ignore_urls "/example.com/,/ws-na.amazon-adsystem.com/,/molpharm.aspetjournals.org/" \
        --ignore-status-codes "403"
```


## License

Open sourced under the [MIT license](LICENSE.md).
