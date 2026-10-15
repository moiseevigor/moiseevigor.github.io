# [Tech Blog](https://moiseevigor.github.io)

[![CircleCI](https://circleci.com/gh/moiseevigor/moiseevigor.github.io/tree/master.svg?style=svg)](https://circleci.com/gh/moiseevigor/moiseevigor.github.io/tree/master)

## Research structure

Read [the publication and navigation contract](docs/research-publication.md) before editing the research presentation. The site uses Jekyll and vanilla CSS/JavaScript.

- `_data/series.yml` owns research topics, scope and ordered outputs. `_data/research.yml` curates supported results and their evidence for Home and Research.
- `/lab/` leads with positive findings, retains decisive negative conclusions, and links complete accounts, manuscripts and background.
- `/projects/` identifies the distinct interactive tools and software libraries.
- Proof Atlas has one overview, an article, a crossing microscope and a compiled Lean library, with a shared navigation. Language reference and coverage are supporting views.
- Its primary objective is the [general geometric language research program](docs/proof-atlas-research-program.md). The compiled library provides bounded constructor geometry, binder telescopes, ordered applications and optional checked-type diagrams. Type diagrams use the same constructor rules and distinguish type-local binding from the original proof context. Repeated type structures share storage; occurrence contexts remain separate.
- `_posts/`, `_appendices/` and `_articles/` retain their scientific scope and historical URLs. Evidence remains in `research/` and public packets.

Research posts contain significant scientific results, not run diaries, transient checkpoints or proposed roadmaps. Preserve the final qualified result and link the original evidence.

## Run Blog

Building image

```
docker build -t blog .
```

Serve blog from root dir

```
docker run --rm --volume="$PWD:/srv/jekyll" -p 4000:4000 -it blog jekyll serve --incremental
```

Open browser at http://localhost:4000/

## Run Blog with `_drafts`

With `--drafts` it will serve `*.markdown` files from `_drafts` folder.

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
