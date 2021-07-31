# [Tech Blog](http://moiseevigor.github.io)

[![Build Status](https://travis-ci.org/moiseevigor/moiseevigor.github.io.svg?branch=master)](https://travis-ci.org/moiseevigor/moiseevigor.github.io)


## Install Blog

Build image

```
docker build -t blog .
```

Serve blog from root dir

```
docker run --rm --volume="$PWD:/srv/jekyll" -p 4000:4000 -it blog jekyll serve --incremental
```

Open browser at http://localhost:4000/

## Testing

```
docker run --rm --volume="$PWD:/srv/jekyll" -p 4000:4000 -it blog bundle exec htmlproofer ./_site --only-4xx --check-html --url-ignore "/example.com/"
```


## License

Open sourced under the [MIT license](LICENSE.md).
