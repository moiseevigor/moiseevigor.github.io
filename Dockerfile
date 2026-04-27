FROM ruby:3.1-slim

RUN apt-get update -qq && \
    apt-get install -y --no-install-recommends \
      build-essential \
      git \
      libgsl-dev \
      zlib1g-dev \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /srv/jekyll

COPY Gemfile Gemfile.lock ./
RUN bundle install --jobs 4 --retry 3

EXPOSE 4000 35729
