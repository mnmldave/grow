Production
  = _ pre:(Command _ '<' _)? c:Command condition:('(' _ RelationalExpression _ ')')? post:(_ '>' _ Command)? _ '->' _ successor:StatementList _ {
      var result = {};
      
      if (pre) {
        result.pre = pre[0];
      }
      result.c = c;
      if (post) {
        result.post = post[3];
      }
      if (condition) {
        result.condition = condition[2];
      }
      result.successor = successor;
      
      return result;
    }

  / _ program:StatementList _ {
      return program;
    }

StatementList
  = statements:(_ Statement)* { 
      var result = [], i;
      for (i = 0; i < statements.length; i++) {
        result.push(statements[i][1]);
      }
      return result;
    }
 
Statement
  = Branch
  / Module

Branch
  = '[' _ statements:StatementList _ ']' { return statements; }

Module
  = command:Command params:('(' _ ParameterList _ ')')? {
      var result = {
        c: command
      };
      
      if (params) {
        result.p = params[2];
      }
      
      return result;
    }

Command
  = c:[a-zA-Z0-9+] { return c; }

ParameterList
  = head:Parameter _ tail:("," _ Parameter)* {
      var result = [head];
      for (var i = 0; i < tail.length; i++) {
        result.push(tail[i][2])
      }
      return result;
    }

Parameter
  = e:ArithmeticExpression { return e; }

RelationalExpression
  = left:ArithmeticExpression _ op:RelationalOperator _ right:ArithmeticExpression {
      return left + op + right;
    }

RelationalOperator
  = '<'
  / '>'
  / '<='
  / '>='
  / '=='
  / '!='

ArithmeticExpression
  = '(' _ left:ArithmeticExpression _ op:ArithmeticOperator _ right:ArithmeticExpression _ ')' { return '(' + left + op + right + ')'; }
  / v:ArithmeticValue { return v; }

ArithmeticOperator
  = '+'
  / '-'
  / '*'
  / '/'
  / '^'

ArithmeticValue
  = v:Identifier { return v; }
  / n:Number { return n; }
  
Number
  = n:Float { return n; }
  / n:Integer { return n; }

Identifier
  = before:[a-zA-Z] after:[a-zA-Z0-9]* { return before + after.join(''); }

Integer
  = sign:[+-]? digits:[0-9]+ { return parseInt(sign + digits.join(""), 10); }

Float
  = sign:[+-]? before:[0-9]* "." after:[0-9]+ {
      return parseFloat(sign + before.join("") + "." + after.join(""));
    }

_
  = [ \t\n\r]*