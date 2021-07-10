FROM jekyll/jekyll

WORKDIR /srv/jekyll
COPY Gemfile .
RUN bundle install
