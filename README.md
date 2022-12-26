# [Tech Blog](https://moiseevigor.github.io)

[![CircleCI](https://circleci.com/gh/moiseevigor/moiseevigor.github.io/tree/master.svg?style=svg)](https://circleci.com/gh/moiseevigor/moiseevigor.github.io/tree/master)

## Install Blog

Building image

```
docker build -t blog .
```

Serve blog from root dir

```
docker run --rm --volume="$PWD:/srv/jekyll" -p 4000:4000 -it blog jekyll serve --incremental
```

Open browser at https://localhost:4000/

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
