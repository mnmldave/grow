BASE_PATH = File.expand_path(File.dirname(__FILE__))
SRC_PATH = File.join(BASE_PATH, 'src')

SERVER_HOST = '0.0.0.0'
SERVER_PORT = 3000

desc 'starts thin web server'
task :server do 
  require 'rack'
  require 'thin'
  
  app = Rack::Builder.new do
    use Rack::ShowExceptions
    run Rack::Directory.new(SRC_PATH)
  end
  
  Rack::Handler::Thin.run(app, { :Host => SERVER_HOST, :Port => SERVER_PORT })
end
  