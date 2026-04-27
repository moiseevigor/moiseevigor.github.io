# frozen_string_literal: true

require 'yaml'
require 'paapi5'

#
# HOW TO USE:
#
# 1. Make sure you have your Amazon Product Advertising API credentials.
#    - Access Key
#    - Secret Key
#    - Associate Tag (Partner Tag)
#
# 2. Fill in your credentials below in the Paapi.configure block.
#
# 3. Run `bundle install` from your project root to install the necessary gems.
#
# 4. Run this script from your project root to fetch data:
#    `bundle exec ruby _scripts/update_book_data.rb`
#
# 5. A new file, `_data/book_details.yml`, will be created with the book data.
#    Commit this file to your repository.
#
# 6. Re-run this script periodically to keep book information up-to-date.
#

# --- START: CONFIGURE YOUR AMAZON CREDENTIALS ---
Paapi.configure do |config|
  config.access_key = 'YOUR_ACCESS_KEY'
  config.secret_key = 'YOUR_SECRET_KEY'
  config.partner_tag = 'YOUR_ASSOCIATE_TAG' # e.g., 'yourstore-20'
  config.partner_type = 'Associates'
  config.marketplace = 'US' # e.g., 'US', 'GB', 'DE', etc.
end
# --- END: CONFIGURE YOUR AMAZON CREDENTIALS ---

BOOKS_CONFIG_PATH = '_data/books.yml'
OUTPUT_PATH = '_data/book_details.yml'

def find_tag_for_asin(asin, books_source)
  book = books_source.find { |b| b['asin'] == asin }
  book ? book['tag'] : nil
end

begin
  puts 'Loading books from _data/books.yml...'
  books_source = YAML.load_file(BOOKS_CONFIG_PATH)
  asins = books_source.map { |b| b['asin'] }
  puts "Found #{asins.length} ASINs to process."

  client = Paapi::Client.new
  rich_book_data = []

  puts 'Fetching item data from Amazon Product Advertising API...'
  # The API allows fetching up to 10 items at a time.
  asins.each_slice(10) do |asin_batch|
    puts "  - Processing batch of #{asin_batch.length}: #{asin_batch.join(', ')}"
    response = client.get_items(
      item_ids: asin_batch,
      resources: [
        'Images.Primary.Large',
        'ItemInfo.Title',
        'DetailPageURL'
      ]
    )

    if response.success?
      response.items.each do |item|
        tag = find_tag_for_asin(item.asin, books_source)
        rich_book_data << {
          'asin' => item.asin,
          'tag' => tag,
          'title' => item.item_info.title.display_value,
          'image_url' => item.images.primary.large.url,
          'page_url' => item.detail_page_url
        }
      end
    else
      puts "    [ERROR] Failed to fetch data for batch: #{asin_batch.join(', ')}"
      puts "    API Error: #{response.error.message}"
    end
    # Respect Amazon's rate limits by waiting a bit between requests.
    sleep(1)
  end

  puts "Successfully fetched details for #{rich_book_data.length} items."
  puts "Saving detailed book data to #{OUTPUT_PATH}..."
  File.write(OUTPUT_PATH, rich_book_data.to_yaml)

  puts "\nDone! ✨"
  puts "Next steps:"
  puts "1. Review and commit the new `#{OUTPUT_PATH}` file."
  puts '2. Build your Jekyll site to see the changes.'

rescue Errno::ENOENT
  puts "[ERROR] Could not find the file `#{BOOKS_CONFIG_PATH}`."
  puts 'Please make sure the file exists and you are running this script from the project root.'
rescue StandardError => e
  puts "\n[ERROR] An unexpected error occurred:"
  puts e.message
  puts e.backtrace.join("\n")
end 