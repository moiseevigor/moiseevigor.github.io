#!/usr/bin/env ruby
# Frozen source reports stay unchanged. Publish only these explicit downloads:
#   ruby scripts/build-proof-atlas-evidence-downloads.rb --write
#   ruby scripts/build-proof-atlas-evidence-downloads.rb --check
require 'json'
require 'zlib'

Dir.chdir(File.expand_path('..', __dir__))
mode = ARGV.empty? ? '--check' : ARGV.fetch(0)
abort 'Use --write or --check' unless ARGV.length <= 1 && %w[--write --check].include?(mode)

reports = %w[
  source-corridor/audit.json
  use-navigation/audit.json
  use-navigation/native-verification.json
  use-inputs/audit.json
  use-sites/native-verification.json
  use-sites/audit.json
  construction-union/audit.json
]

reports.each do |report|
  source = File.join('research/proof-atlas', report)
  abort "Evidence report exceeds 2 MiB: #{source}" if File.size(source) > 2 * 1024 * 1024
  bytes = File.binread(source)
  JSON.parse(bytes)
  target = "#{source}.gz"
  if mode == '--write'
    Zlib::GzipWriter.open(target, Zlib::BEST_COMPRESSION) do |writer|
      writer.mtime = 0
      writer.write(bytes)
    end
  end
  Zlib::GzipReader.open(target) do |reader|
    abort "Published evidence differs from source: #{target}" unless reader.read(bytes.bytesize + 1) == bytes && reader.eof?
  end
end

puts "PASS: #{reports.length} evidence downloads preserve their original JSON bytes"
