https://gist.github.com/ngpestelos/4fc2e31e19f86b9cf10b

```
docker rmi $(docker images -q --filter "dangling=true")
```
