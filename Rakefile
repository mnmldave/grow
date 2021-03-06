BASE_PATH = File.expand_path(File.dirname(__FILE__))
SRC_PATH = File.join(BASE_PATH, 'src')

SERVER_HOST = '0.0.0.0'
SERVER_PORT = 3000

DEPLOY_SERVER = ENV['DEPLOY_SERVER']

namespace :compile do
  desc 'compiles peg files and rewrites to be CommonJS friendly'
  task :peg do
    Dir.glob(File.join(SRC_PATH, '**', '*.pegjs')).each do |input_path|
      IO.popen('pegjs', 'w+') do |pipe|
        File.open(input_path) { |input| pipe.puts(input.read) }
        pipe.close_write
        out_path = File.join(File.dirname(input_path), File.basename(input_path, '.pegjs') + '.js')
        out_str = pipe.read
        out_str.gsub!(/^module\.exports = \(function\(\)\{$/, '(function(){')
        out_str.gsub!(/^  return result;$/, '  jQuery.extend(exports, result);')
        File.open(out_path, 'w') { |out| out.puts out_str }
      end
    end
  end
end

desc 'starts thin web server'
task :server do 
  require 'rack'
  require 'rack-cache'
  require 'thin'
  
  app = Rack::Builder.new do
    use Rack::ShowExceptions
    use Rack::Cache, 
        :verbose => false,
        :allow_reload => true,
        :default_ttl => 0
    run Rack::Directory.new(SRC_PATH)
  end
  
  Rack::Handler::Thin.run(app, { :Host => SERVER_HOST, :Port => SERVER_PORT })
end
  
desc 'Deploys to the remote server'
task :deploy do
  raise "Please specify a DEPLOY_SERVER env var." unless DEPLOY_SERVER
  
  chdir(BUILD_PATH) do
    args = []
    args << "rsync"
    args << "-avz"
    args << "--stats"
    args << "--progress"
    args << "--delete"
    args << "."
    args << DEPLOY_SERVER
    system(*args)
  end
end
