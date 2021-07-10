# Tech Blog http://moiseevigor.github.io

[![Build Status](https://travis-ci.org/moiseevigor/moiseevigor.github.io.svg?branch=master)](https://travis-ci.org/moiseevigor/moiseevigor.github.io)  [![Gitter](https://badges.gitter.im/Join%20Chat.svg)](https://gitter.im/moiseevigor/moiseevigor.github.io?utm_source=badge&utm_medium=badge&utm_campaign=pr-badge)


## INSTALL Blog

Build image

```
docker build -t blog .
```

Serve blog from root dir

```
docker run --rm --volume="$PWD:/srv/jekyll" -p 4000:4000 -it blog jekyll serve --incremental
```

Open browser at http://localhost:4000/

## License

Open sourced under the [MIT license](LICENSE.md).

<3
