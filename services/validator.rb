# Input validation utilities with various issues

module Validator
  class ValidationError < StandardError
    attr_reader :field, :rule

    def initialize(field, message, rule = nil)
      @field = field
      @rule = rule
      super("#{field}: #{message}")
    end
  end

  class SchemaValidator
    def initialize(schema = {})
      @schema = schema
      @errors = []
    end

    def validate(data)
      @errors = []

      @schema.each do |field, rules|
        value = data[field]

        rules.each do |rule|
          case rule[:type]
          when :required
            if value.nil? || (value.is_a?(String) && value.strip.empty?)
              @errors << ValidationError.new(field, "is required", :required)
            end
          when :min_length
            if value.is_a?(String) && value.length < rule[:value]
              @errors << ValidationError.new(field, "must be at least #{rule[:value]} characters", :min_length)
            end
          when :max_length
            if value.is_a?(String) && value.length > rule[:value]
              @errors << ValidationError.new(field, "must be at most #{rule[:value]} characters", :max_length)
            end
          when :pattern
            # Bug: doesn't handle nil value before matching
            unless value.match?(rule[:value])
              @errors << ValidationError.new(field, "does not match expected pattern", :pattern)
            end
          when :range
            if value.is_a?(Numeric) && (value < rule[:min] || value > rule[:max])
              @errors << ValidationError.new(field, "must be between #{rule[:min]} and #{rule[:max]}", :range)
            end
          when :inclusion
            unless rule[:in].include?(value)
              @errors << ValidationError.new(field, "must be one of: #{rule[:in].join(', ')}", :inclusion)
            end
          when :custom
            begin
              result = rule[:validator].call(value)
              unless result
                @errors << ValidationError.new(field, rule[:message] || "is invalid", :custom)
              end
            rescue => e
              @errors << ValidationError.new(field, "validation error: #{e.message}", :custom)
            end
          end
        end
      end

      @errors.empty?
    end

    def errors
      @errors
    end

    def valid?
      @errors.empty?
    end

    def error_messages
      @errors.map(&:message)
    end
  end

  # Email validator - oversimplified regex
  class EmailValidator
    EMAIL_REGEX = /\A[\w+\-.]+@[a-z\d\-]+(\.[a-z\d\-]+)*\.[a-z]+\z/i

    def self.valid?(email)
      return false if email.nil?
      # Bug: doesn't handle emails longer than 254 characters
      !!(email =~ EMAIL_REGEX)
    end
  end

  # Password strength checker
  class PasswordValidator
    def self.validate(password)
      errors = []

      errors << "too short (minimum 8 characters)" if password.length < 8
      errors << "must contain uppercase letter" unless password =~ /[A-Z]/
      errors << "must contain lowercase letter" unless password =~ /[a-z]/
      errors << "must contain digit" unless password =~ /\d/
      # Bug: doesn't check for special characters

      { valid: errors.empty?, errors: errors, strength: calculate_strength(password) }
    end

    def self.calculate_strength(password)
      score = 0
      score += 1 if password.length >= 8
      score += 1 if password.length >= 12
      score += 1 if password =~ /[A-Z]/ && password =~ /[a-z]/
      score += 1 if password =~ /\d/
      score += 1 if password =~ /[^A-Za-z0-9]/

      case score
      when 0..1 then "weak"
      when 2..3 then "medium"
      when 4..5 then "strong"
      end
    end
  end

  # URL validator
  class URLValidator
    def self.valid?(url)
      return false if url.nil? || url.empty?
      # Bug: very basic check, doesn't validate properly
      url.start_with?("http://", "https://") && url.include?(".")
    end
  end
end
