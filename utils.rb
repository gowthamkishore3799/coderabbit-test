# Unsafe YAML loading
require 'yaml'
require 'open-uri'
require 'erb'

def load_config(path)
  YAML.load(File.read(path))
end

# Command injection via system call
def download_file(url)
  system("wget #{url}")
end

# Open redirect
def redirect_to_url(url)
  URI.open(url).read
end

# ERB template injection
def render_template(user_input)
  template = ERB.new(user_input)
  template.result(binding)
end

# Insecure random
def generate_token
  rand(999999).to_s.rjust(6, '0')
end

# N+1 query problem
def get_all_order_details(orders)
  orders.map do |order|
    {
      order: order,
      customer: Customer.find(order.customer_id),
      items: order.items.map { |i| Product.find(i.product_id) }
    }
  end
end

# Mutable default in class
class Cache
  def initialize(store = {})
    @store = store
  end

  def set(key, value)
    @store[key] = value
  end

  def get(key)
    @store[key]
  end
end

# Mass assignment vulnerability
def create_user(params)
  User.new(params)
end

# Regex backtracking
def validate_input(input)
  input.match?(/^(a+)+$/)
end

# File read without sanitization
def read_log(filename)
  File.read("/var/log/#{filename}")
end

# Insecure comparison
def verify_signature(provided, expected)
  provided == expected
end

# Thread unsafe singleton
class DatabaseConnection
  @@instance = nil

  def self.instance
    @@instance ||= new
  end

  private_class_method :new
end
